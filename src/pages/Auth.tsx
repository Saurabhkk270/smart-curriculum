import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { GraduationCap } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabaseConfigError } from '@/integrations/supabase/client';
import { getSupabaseErrorMessage } from '@/lib/supabaseErrors';

const Auth = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [signUpData, setSignUpData] = useState({
    email: '',
    password: '',
    fullName: '',
    studentId: '',
    role: 'student',
    course: '',
    semester: ''
  });

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Unable to sign in.'));
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signUpData.email,
      password: signUpData.password,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: {
          full_name: signUpData.fullName,
          student_id: signUpData.studentId,
          role: signUpData.role,
          course: signUpData.course,
          semester: signUpData.semester
        }
      }
    });

    if (error) {
      toast.error(getSupabaseErrorMessage(error, 'Unable to create your account.'));
    } else {
      toast.success(data.session ? 'Account created successfully!' : 'Account created. Check your email to confirm it before signing in.');
      if (data.session) navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between text-slate-800">
      {/* Top Institutional Tricolor Accent & Header */}
      <header className="border-b border-slate-200 bg-white shadow-sm">
        <div className="h-1 bg-gradient-to-r from-orange-500 via-white to-green-600" />
        <div className="max-w-7xl mx-auto px-4 py-3 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <img 
              src="/logo.png" 
              alt="SVSU Official Seal" 
              className="h-12 w-12 object-contain filter drop-shadow-sm" 
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 tracking-tight sm:text-base">
                  श्री विश्वकर्मा कौशल विश्वविद्यालय
                </span>
                <span className="hidden md:inline-block text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-800 font-medium border border-blue-200">
                  Govt. of Haryana
                </span>
              </div>
              <p className="text-xs font-semibold text-slate-700 tracking-wide">
                SHRI VISHWAKARMA SKILL UNIVERSITY
              </p>
              <p className="text-[10px] text-slate-500 hidden sm:block">
                (State Skill University enacted under Govt. of Haryana Act 25, 2016)
              </p>
            </div>
          </div>
          
          <div className="text-right hidden sm:block">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-medium text-slate-700">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Academic ERP Session: 2026-2027
            </div>
            <p className="text-[10px] text-slate-500 mt-0.5">Integrated University Management System (IUMS)</p>
          </div>
        </div>
      </header>

      {/* Main Authentication Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-4">
        <div className="w-full max-w-xl">
          {/* Institutional Statutory Advisory Notice */}
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 text-xs flex items-start gap-2 shadow-sm">
            <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-amber-200/80 rounded mt-0.5">
              Notice
            </span>
            <p className="leading-relaxed">
              Authorized access only. Use registered institutional credentials to access student, faculty, and administrative portals.
            </p>
          </div>

          <Card className="border border-slate-200 shadow-xl bg-white rounded-xl overflow-hidden">
            <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between border-b border-slate-800">
              <div>
                <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                  <GraduationCap className="w-5 h-5 text-blue-400" />
                  Academic Portal Authentication
                </h1>
                <p className="text-xs text-slate-300 mt-0.5">
                  Single Sign-On for Students, Faculty & University Administration
                </p>
              </div>
              <div className="text-right">
                <span className="text-[11px] font-mono text-slate-400 block">IUMS SECURE</span>
                <span className="text-[10px] text-emerald-400 font-semibold">● 256-bit SSL</span>
              </div>
            </div>

            <CardContent className="p-6">
              {supabaseConfigError && (
                <Alert variant="destructive" className="mb-4">
                  <AlertDescription>{supabaseConfigError}</AlertDescription>
                </Alert>
              )}

              <Tabs defaultValue="signin" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6 bg-slate-100 p-1 rounded-lg">
                  <TabsTrigger 
                    value="signin" 
                    className="font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm py-2"
                  >
                    Portal Sign-In
                  </TabsTrigger>
                  <TabsTrigger 
                    value="signup" 
                    className="font-semibold text-xs data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-sm py-2"
                  >
                    New Student / Faculty Registration
                  </TabsTrigger>
                </TabsList>

                {/* Sign-In Tab */}
                <TabsContent value="signin">
                  <form onSubmit={handleSignIn} className="space-y-4">
                    <div className="space-y-1.5">
                      <Label htmlFor="signin-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Institutional Email ID
                      </Label>
                      <Input
                        id="signin-email"
                        name="email"
                        type="email"
                        placeholder="username@svsu.ac.in / your.email@domain.com"
                        className="h-10 text-sm border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md"
                        required
                      />
                      <span className="text-[11px] text-slate-500">
                        Use registered institutional or student email.
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="signin-password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Password
                        </Label>
                        <a 
                          href="mailto:ithelpdesk@svsu.ac.in?subject=Password%20Reset%20Request%20-%20SVSU%20ERP" 
                          className="text-xs text-blue-700 hover:underline"
                        >
                          Forgot Password?
                        </a>
                      </div>
                      <Input
                        id="signin-password"
                        name="password"
                        type="password"
                        placeholder="••••••••••••"
                        className="h-10 text-sm border-slate-300 focus:border-blue-600 focus:ring-1 focus:ring-blue-600 rounded-md font-mono"
                        required
                      />
                    </div>

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-blue-700 hover:bg-blue-800 text-white font-semibold text-sm shadow rounded-md transition-colors"
                        disabled={loading}
                      >
                        {loading ? 'Authenticating with ERP...' : 'Sign In to University ERP'}
                      </Button>
                    </div>

                    <div className="text-center pt-2">
                      <p className="text-xs text-slate-500">
                        Facing issues logging in? Contact University Helpdesk: <span className="font-semibold text-slate-700">ithelpdesk@svsu.ac.in</span>
                      </p>
                    </div>
                  </form>
                </TabsContent>

                {/* Sign-Up Tab */}
                <TabsContent value="signup">
                  <form onSubmit={handleSignUp} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-name" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Full Name (As per Matriculation)
                        </Label>
                        <Input
                          id="signup-name"
                          value={signUpData.fullName}
                          onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                          placeholder="e.g. Rahul Sharma"
                          className="h-9 text-sm border-slate-300 rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-student-id" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Roll / Registration / Employee ID
                        </Label>
                        <Input
                          id="signup-student-id"
                          value={signUpData.studentId}
                          onChange={(e) => setSignUpData({ ...signUpData, studentId: e.target.value })}
                          placeholder="e.g. 230101001"
                          className="h-9 text-sm border-slate-300 rounded-md uppercase font-mono"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label htmlFor="signup-email" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Official / Primary Email ID
                        </Label>
                        <Input
                          id="signup-email"
                          type="email"
                          value={signUpData.email}
                          onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                          placeholder="rahul@svsu.ac.in"
                          className="h-9 text-sm border-slate-300 rounded-md"
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label htmlFor="signup-role" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                          Institutional Category / Role
                        </Label>
                        <Select 
                          value={signUpData.role} 
                          onValueChange={(value) => setSignUpData({ 
                            ...signUpData, 
                            role: value, 
                            course: value === 'teacher' ? '' : signUpData.course, 
                            semester: value === 'teacher' ? '' : signUpData.semester 
                          })}
                        >
                          <SelectTrigger id="signup-role" className="h-9 text-sm border-slate-300 rounded-md">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="student">Student (Enrolled Candidate)</SelectItem>
                            <SelectItem value="teacher">Faculty / Instructor</SelectItem>
                            <SelectItem value="admin">University Administrator</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {signUpData.role === 'student' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg">
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-course" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Degree / Course of Study
                          </Label>
                          <Input
                            id="signup-course"
                            value={signUpData.course}
                            onChange={(e) => setSignUpData({ ...signUpData, course: e.target.value })}
                            placeholder="e.g. B.Tech CSE / B.Voc Robotics"
                            className="h-9 text-sm border-slate-300 rounded-md bg-white"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <Label htmlFor="signup-semester" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Current Academic Semester
                          </Label>
                          <Input
                            id="signup-semester"
                            value={signUpData.semester}
                            onChange={(e) => setSignUpData({ ...signUpData, semester: e.target.value })}
                            placeholder="e.g. 4th Semester"
                            className="h-9 text-sm border-slate-300 rounded-md bg-white"
                            required
                          />
                        </div>
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="signup-password" className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                        Set Strong Portal Password
                      </Label>
                      <Input
                        id="signup-password"
                        type="password"
                        value={signUpData.password}
                        onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                        placeholder="At least 6 characters"
                        className="h-9 text-sm border-slate-300 rounded-md font-mono"
                        required
                        minLength={6}
                      />
                    </div>

                    <div className="pt-2">
                      <Button 
                        type="submit" 
                        className="w-full h-11 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm shadow rounded-md transition-colors" 
                        disabled={loading}
                      >
                        {loading ? 'Creating University Profile...' : 'Complete Academic Registration'}
                      </Button>
                    </div>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Official Institutional Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-2">
          <p>© 2026 Shri Vishwakarma Skill University (SVSU). Integrated University Management System.</p>
          <div className="flex items-center gap-4 text-[11px] text-slate-600">
            <span>Dudhola, Palwal, Haryana</span>
            <span>•</span>
            <span>Statutory Compliance ISO 9001:2015</span>
            <span>•</span>
            <a href="https://svsu.ac.in" target="_blank" rel="noreferrer" className="text-blue-700 hover:underline">
              Official University Website
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Auth;
