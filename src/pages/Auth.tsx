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
      toast.error(error.message);
    } else {
      toast.success('Welcome back!');
      navigate('/');
    }
    setLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase.auth.signUp({
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
      toast.error(error.message);
    } else {
      toast.success('Account created successfully!');
      navigate('/');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-primary/5 to-secondary/5">
      <Card className="w-full max-w-md shadow-2xl border border-border/50 bg-card">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-24 h-24 rounded-2xl bg-white/5 backdrop-blur-md border border-white/10 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(var(--primary),0.3)] animate-float p-3 transition-transform hover:scale-105">
            <img src="/logo.png" alt="App Logo" className="w-full h-full object-contain filter drop-shadow-xl" />
          </div>
          <CardTitle className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-primary via-indigo-500 to-accent bg-clip-text text-transparent drop-shadow-sm">Smart Curriculum</CardTitle>
          <CardDescription className="text-base mt-2 font-medium">Intelligent attendance & learning management</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    name="email"
                    type="email"
                    placeholder="your.email@college.edu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    name="password"
                    type="password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-name">Full Name</Label>
                  <Input
                    id="signup-name"
                    value={signUpData.fullName}
                    onChange={(e) => setSignUpData({ ...signUpData, fullName: e.target.value })}
                    placeholder="John Doe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">College Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpData.email}
                    onChange={(e) => setSignUpData({ ...signUpData, email: e.target.value })}
                    placeholder="your.email@college.edu"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-student-id">Student/Employee ID</Label>
                  <Input
                    id="signup-student-id"
                    value={signUpData.studentId}
                    onChange={(e) => setSignUpData({ ...signUpData, studentId: e.target.value })}
                    placeholder="STU123456"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-role">Role</Label>
                  <Select value={signUpData.role} onValueChange={(value) => setSignUpData({ ...signUpData, role: value, course: value === 'teacher' ? '' : signUpData.course, semester: value === 'teacher' ? '' : signUpData.semester })}>
                    <SelectTrigger id="signup-role">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">Student</SelectItem>
                      <SelectItem value="teacher">Teacher</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {signUpData.role === 'student' && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="signup-course">Course</Label>
                      <Input
                        id="signup-course"
                        value={signUpData.course}
                        onChange={(e) => setSignUpData({ ...signUpData, course: e.target.value })}
                        placeholder="Computer Science"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-semester">Semester</Label>
                      <Input
                        id="signup-semester"
                        value={signUpData.semester}
                        onChange={(e) => setSignUpData({ ...signUpData, semester: e.target.value })}
                        placeholder="3rd Semester"
                        required
                      />
                    </div>
                  </>
                )}
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpData.password}
                    onChange={(e) => setSignUpData({ ...signUpData, password: e.target.value })}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Creating account...' : 'Create Account'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
