import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { QrCode } from 'lucide-react';
import QRGenerator from '@/components/dashboard/QRGenerator';

const TeacherQRCode = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <QrCode className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">QR Code</h1>
          <p className="text-muted-foreground">Generate QR codes for attendance</p>
        </div>
      </div>
      
      <Card className="shadow-lg border-2 border-border">
        <CardHeader className="border-b bg-muted/30">
          <CardTitle className="text-2xl">QR Code Generator</CardTitle>
          <CardDescription>Create attendance QR codes</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <QRGenerator />
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherQRCode;
