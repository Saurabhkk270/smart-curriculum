import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verify caller is admin
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)
    
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    // Check if user is admin in profiles
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Forbidden. Admin only.' }), { status: 403, headers: corsHeaders })
    }

    const { users } = await req.json()
    if (!users || !Array.isArray(users)) {
      return new Response(JSON.stringify({ error: 'Invalid payload' }), { status: 400, headers: corsHeaders })
    }

    const results = []
    
    for (const u of users) {
      const userRole = u.role || 'student';
      const defaultPassword = userRole === 'teacher' ? 'Teacher@123' : 'Student@123';
      
      const { data, error } = await supabaseClient.auth.admin.createUser({
        email: u.email,
        password: u.password || defaultPassword,
        email_confirm: true,
        user_metadata: {
          full_name: u.full_name,
          student_id: u.student_id,
          role: userRole,
          course: u.course,
          branch: u.branch,
          semester: u.semester,
          section: u.section
        }
      })
      
      if (error) {
        results.push({ email: u.email, success: false, error: error.message })
      } else {
        // Also ensure profile role is set to userRole
        if (data?.user?.id) {
          await supabaseClient
            .from('profiles')
            .update({
              role: userRole,
              course: u.course,
              branch: u.branch,
              section: u.section,
              account_status: u.account_status || 'active'
            })
            .eq('id', data.user.id)
        }
        results.push({ email: u.email, success: true, id: data.user.id })
      }
    }

    return new Response(JSON.stringify({ results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
