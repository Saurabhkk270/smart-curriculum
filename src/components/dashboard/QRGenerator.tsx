import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import QRCode from 'qrcode';
import { Download, RefreshCw } from 'lucide-react';

const QRGenerator = () => {
  const { profile } = useAuth();
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [sessionId, setSessionId] = useState<string>('');
  const countdownStart = 15; // seconds between rotations
  const [countdown, setCountdown] = useState<number>(0);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    const { data } = await supabase
      .from('classes')
      .select('*')
      .eq('teacher_id', profile?.id);
    
    if (data) setClasses(data);
  };

  const generateQR = async (silent?: boolean) => {
    if (!selectedClass) {
      toast.error('Please select a class');
      return;
    }

    const qrData = `attendance_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const expirationTime = new Date(Date.now() + 20 * 1000); // 20 seconds

    const { data, error } = await supabase
      .from('attendance_sessions')
      .insert({
        class_id: selectedClass,
        qr_code_data: qrData,
        expires_at: expirationTime.toISOString(),
        created_by: profile?.id
      })
      .select()
      .single();

    if (error) {
      toast.error('Failed to generate QR code');
      return;
    }

    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 2,
      color: {
        dark: '#1e40af',
        light: '#ffffff'
      }
    });

    setQrCodeUrl(qrCodeDataUrl);
    setSessionId(data.id);
    setCountdown(countdownStart);
    if (!silent) toast.success('QR code generated successfully!');
  };

  const downloadQR = () => {
    const link = document.createElement('a');
    link.download = `attendance_qr_${new Date().getTime()}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  useEffect(() => {
    if (!qrCodeUrl) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setCountdown((c) => {
        if (c <= 1) {
          generateQR(true);
          return countdownStart;
        }
        return c - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [qrCodeUrl, selectedClass]);

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Select Class</Label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={() => generateQR()} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Generate New QR Code
        </Button>
      </div>

      {qrCodeUrl && (
        <div className="space-y-4">
          <div className="bg-card p-4 sm:p-6 rounded-lg border border-border shadow-[var(--shadow-soft)]">
            <img src={qrCodeUrl} alt="Attendance QR Code" className="mx-auto rounded-lg w-full max-w-[300px] sm:max-w-[400px]" />
            <p className="text-center mt-4 text-xs sm:text-sm text-muted-foreground">
              Auto-refresh in <span className="font-semibold">{countdown}s</span> to prevent screenshot proxies
            </p>
          </div>

          <Button onClick={downloadQR} variant="outline" className="w-full">
            <Download className="w-4 h-4 mr-2" />
            Download QR Code
          </Button>
        </div>
      )}
    </div>
  );
};

export default QRGenerator;
