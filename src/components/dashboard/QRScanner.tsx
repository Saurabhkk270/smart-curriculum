import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff } from 'lucide-react';

interface QRScannerProps {
  onClose: () => void;
}

const QRScanner = ({ onClose }: QRScannerProps) => {
  const { profile } = useAuth();
  const [isScanning, setIsScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraId, setCameraId] = useState<string | null>(null);
  const [motionDetected, setMotionDetected] = useState(false);
  const lastFrameRef = useRef<ImageData | null>(null);
  const motionTimestampRef = useRef<number>(0);

  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        // Prefer back camera (environment facing) on mobile
        const backCamera = devices.find(device => 
          device.label.toLowerCase().includes('back') || 
          device.label.toLowerCase().includes('environment')
        );
        setCameraId(backCamera ? backCamera.id : devices[0].id);
      }
    }).catch(err => {
      toast.error('Unable to access camera');
    });
  }, []);

  const detectMotion = () => {
    const video = document.querySelector('#qr-reader video') as HTMLVideoElement;
    if (!video) return;

    const canvas = document.createElement('canvas');
    canvas.width = 160; // Lower resolution for faster processing
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) return;

    const checkMotion = () => {
      if (!isScanning) return;
      
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const currentFrame = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      if (lastFrameRef.current) {
        let diffPixels = 0;
        for (let i = 0; i < currentFrame.data.length; i += 4) {
          const diff = Math.abs(currentFrame.data[i] - lastFrameRef.current.data[i]);
          if (diff > 25) diffPixels++; // More sensitive threshold
        }
        
        const motionPercentage = (diffPixels / (currentFrame.data.length / 4)) * 100;
        if (motionPercentage > 0.3) { // Lower threshold for easier detection
          setMotionDetected(true);
          motionTimestampRef.current = Date.now();
        } else if (Date.now() - motionTimestampRef.current > 3000) {
          // Only set to false if no motion for 3 seconds
          setMotionDetected(false);
        }
      }
      
      lastFrameRef.current = currentFrame;
      setTimeout(checkMotion, 200); // Check less frequently
    };
    
    checkMotion();
  };

  const startScanning = async () => {
    if (!cameraId) return;
    
    try {
      scannerRef.current = new Html5Qrcode('qr-reader');
      await scannerRef.current.start(
        cameraId,
        { fps: 10, qrbox: { width: 250, height: 250 } },
        async (decodedText) => {
          // Check if motion was detected in last 5 seconds
          const recentMotion = Date.now() - motionTimestampRef.current < 5000;
          if (!recentMotion && motionTimestampRef.current > 0) {
            toast.error('Please move camera slightly to verify live scan');
            return;
          }
          await handleScan(decodedText);
        },
        () => {}
      );
      setIsScanning(true);
      setTimeout(detectMotion, 1000);
    } catch (err) {
      toast.error('Failed to start camera');
    }
  };

  const stopScanning = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        setIsScanning(false);
      } catch (err) {
        console.error('Error stopping scanner:', err);
      }
    }
  };

  const handleScan = async (qrData: string) => {
    try {
      await stopScanning();

      const { data: session, error: sessionError } = await supabase
        .from('attendance_sessions')
        .select('*')
        .eq('qr_code_data', qrData)
        .maybeSingle();

      if (sessionError || !session) {
        toast.error('Invalid QR code');
        return;
      }

      if (new Date(session.expires_at) < new Date()) {
        toast.error('QR code has expired');
        return;
      }

      const { error } = await supabase
        .from('attendance_records')
        .insert({
          session_id: session.id,
          student_id: profile?.id,
          marked_by: profile?.id,
          is_manual: false
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('Attendance already marked for this session');
        } else {
          toast.error('Failed to mark attendance');
        }
      } else {
        toast.success('Attendance marked successfully!');
        onClose();
      }
    } catch (error) {
      toast.error('An error occurred while marking attendance');
    }
  };

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, []);

  return (
    <div className="space-y-4">
      <div id="qr-reader" className="w-full max-w-md mx-auto rounded-lg overflow-hidden shadow-[var(--shadow-medium)]" />
      
      {isScanning && (
        <div className="text-center">
          <Badge variant={motionDetected ? "default" : "secondary"}>
            {motionDetected ? "Live Camera ✓" : "Hold steady and scan"}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {!motionDetected ? "Move camera slightly first" : "Ready to scan"}
          </p>
        </div>
      )}
      
      <div className="flex justify-center gap-2">
        {!isScanning ? (
          <Button onClick={startScanning} disabled={!cameraId}>
            <Camera className="w-4 h-4 mr-2" />
            Start Scanning
          </Button>
        ) : (
          <Button onClick={stopScanning} variant="destructive">
            <CameraOff className="w-4 h-4 mr-2" />
            Stop Scanning
          </Button>
        )}
      </div>
    </div>
  );
};

export default QRScanner;
