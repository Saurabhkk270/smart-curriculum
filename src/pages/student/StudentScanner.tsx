import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { QrCode } from 'lucide-react';
import QRScanner from '@/components/dashboard/QRScanner';
import { useAuth } from '@/components/AuthProvider';
import AttendanceStats from '@/components/dashboard/AttendanceStats';

const StudentScanner = () => {
  const { profile } = useAuth();
  const [showScanner, setShowScanner] = useState(false);

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center gap-2 sm:gap-3">
        <div className="p-2 rounded-lg bg-primary/10">
          <QrCode className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
        </div>
        <div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight">QR Scanner</h1>
          <p className="text-xs sm:text-sm text-muted-foreground">Scan QR codes to mark attendance</p>
        </div>
      </div>

      <AttendanceStats />
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">Scan Attendance</CardTitle>
          <CardDescription>Use your camera to scan QR codes</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div className="p-6 rounded-lg border-2 border-dashed border-border bg-muted/30">
              <div className="flex flex-col items-center gap-4 text-center">
                <div className="p-4 rounded-full bg-primary/10">
                  <QrCode className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Student ID: {profile?.student_id || 'N/A'}</h3>
                  <p className="text-sm text-muted-foreground mb-4">Click the button below to scan attendance QR codes</p>
                  <Button onClick={() => setShowScanner(true)} className="shadow-md hover:shadow-lg transition-all">
                    Open QR Scanner
                  </Button>
                </div>
              </div>
            </div>
            {showScanner && <QRScanner onClose={() => setShowScanner(false)} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentScanner;
