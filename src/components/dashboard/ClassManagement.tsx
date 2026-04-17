import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Trash2, Users } from 'lucide-react';

const ClassManagement = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [newClass, setNewClass] = useState({ name: '', code: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select(`
        *,
        class_enrollments(count)
      `)
      .eq('teacher_id', profile?.id);
    
    if (data) setClasses(data);
  };

  const createClass = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { error } = await supabase
      .from('classes')
      .insert({
        name: newClass.name,
        code: newClass.code,
        teacher_id: profile?.id
      });

    if (error) {
      toast.error('Failed to create class');
    } else {
      toast.success('Class created successfully!');
      setNewClass({ name: '', code: '' });
      fetchClasses();
    }
    setLoading(false);
  };

  const deleteClass = async (classId: string) => {
    const { error } = await supabase
      .from('classes')
      .delete()
      .eq('id', classId);

    if (error) {
      toast.error('Failed to delete class');
    } else {
      toast.success('Class deleted successfully!');
      fetchClasses();
    }
  };

  return (
    <div className="space-y-6">
      <form onSubmit={createClass} className="space-y-4 p-4 bg-muted rounded-lg">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="class-name">Class Name</Label>
            <Input
              id="class-name"
              value={newClass.name}
              onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
              placeholder="Computer Science 101"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="class-code">Class Code</Label>
            <Input
              id="class-code"
              value={newClass.code}
              onChange={(e) => setNewClass({ ...newClass, code: e.target.value })}
              placeholder="CS101"
              required
            />
          </div>
        </div>
        <Button type="submit" disabled={loading} className="w-full">
          <Plus className="w-4 h-4 mr-2" />
          Create Class
        </Button>
      </form>

      <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((cls) => (
          <Card key={cls.id} className="shadow-[var(--shadow-soft)] hover:shadow-[var(--shadow-medium)] transition-all">
            <CardHeader className="pb-3">
              <CardTitle className="text-base sm:text-lg flex items-center justify-between gap-2">
                <span className="truncate">{cls.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => deleteClass(cls.id)}
                  className="flex-shrink-0"
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-xs sm:text-sm text-muted-foreground">Code: {cls.code}</p>
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <Users className="w-4 h-4 text-accent" />
                <span>{cls.class_enrollments?.[0]?.count || 0} students</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {classes.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <p>No classes yet. Create your first class to get started!</p>
        </div>
      )}
    </div>
  );
};

export default ClassManagement;
