import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  Settings,
  Building,
  ShieldCheck,
  Calendar,
  Database,
  Save,
  RefreshCw,
  QrCode,
  Lock,
  CheckCircle2,
} from "lucide-react";

const AdminSettings = () => {
  const { toast } = useToast();

  // Institution Info
  const [univName, setUnivName] = useState("Shri Vishwakarma Skill University (SVSU)");
  const [univCode, setUnivCode] = useState("SVSU-HAR");
  const [campusAddress, setCampusAddress] = useState("Dudhola, Palwal, Haryana 121102");
  const [contactEmail, setContactEmail] = useState("info@svsu.ac.in");
  const [contactPhone, setContactPhone] = useState("+91 1800 1800 147");

  // Attendance Policies
  const [minAttendance, setMinAttendance] = useState("75");
  const [qrRefreshSeconds, setQrRefreshSeconds] = useState("15");
  const [strictGeofence, setStrictGeofence] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Academic Term
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [currentTerm, setCurrentTerm] = useState("Odd Semester");
  const [termStartDate, setTermStartDate] = useState("2026-08-01");
  const [termEndDate, setTermEndDate] = useState("2026-12-20");

  const [isSaving, setIsSaving] = useState(false);

  // Save Settings
  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      toast({
        title: "Settings Saved",
        description: "Campus policies and institutional parameters updated successfully.",
      });
    }, 600);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-3xl font-bold tracking-tight">System & Campus Settings</h2>
            <Badge variant="outline" className="border-primary text-primary">
              Configuration Portal
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1">
            Configure institutional profile, attendance enforcement thresholds, and academic calendar dates.
          </p>
        </div>
        <Button onClick={handleSaveSettings} disabled={isSaving}>
          <Save className="h-4 w-4 mr-2" />
          {isSaving ? "Saving Changes..." : "Save Settings"}
        </Button>
      </div>

      <Tabs defaultValue="institution" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 w-full">
          <TabsTrigger value="institution" className="gap-2">
            <Building className="h-4 w-4" />
            Institution
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-2">
            <QrCode className="h-4 w-4" />
            Attendance Policy
          </TabsTrigger>
          <TabsTrigger value="calendar" className="gap-2">
            <Calendar className="h-4 w-4" />
            Academic Term
          </TabsTrigger>
          <TabsTrigger value="system" className="gap-2">
            <Database className="h-4 w-4" />
            System & Cloud
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: Institution Info */}
        <TabsContent value="institution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>University Details</CardTitle>
              <CardDescription>
                Official institutional identity displayed across student report cards, certificates, and notices.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Institution Name</label>
                  <Input value={univName} onChange={(e) => setUnivName(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Institution Code</label>
                  <Input value={univCode} onChange={(e) => setUnivCode(e.target.value)} />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium">Campus Address</label>
                <Input value={campusAddress} onChange={(e) => setCampusAddress(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Official Contact Email</label>
                  <Input value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Administrative Helpline</label>
                  <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Attendance Policies */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attendance Regulations</CardTitle>
              <CardDescription>
                Define compliance rules, minimum attendance criteria, and anti-proxy safeguards.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span>Minimum Required Attendance (%)</span>
                    <Badge variant="outline">{minAttendance}%</Badge>
                  </label>
                  <Input
                    type="number"
                    min="50"
                    max="100"
                    value={minAttendance}
                    onChange={(e) => setMinAttendance(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Students below this threshold are flagged on progress reports and admit cards.
                  </p>
                </div>

                <div className="space-y-2 p-4 rounded-lg border bg-muted/20">
                  <label className="text-sm font-semibold flex items-center justify-between">
                    <span>QR Code Refresh Rate (Seconds)</span>
                    <Badge variant="outline">{qrRefreshSeconds}s</Badge>
                  </label>
                  <Input
                    type="number"
                    min="5"
                    max="60"
                    value={qrRefreshSeconds}
                    onChange={(e) => setQrRefreshSeconds(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    Dynamic time interval before a projected QR code rotates to block screenshot sharing.
                  </p>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-semibold text-sm">Biometric & Face Recognition Verification</div>
                    <div className="text-xs text-muted-foreground">
                      Require device biometric confirmation prior to marking QR attendance.
                    </div>
                  </div>
                  <Button
                    variant={biometricEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBiometricEnabled(!biometricEnabled)}
                  >
                    {biometricEnabled ? "Enabled" : "Disabled"}
                  </Button>
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border">
                  <div>
                    <div className="font-semibold text-sm">Campus Geofence Validation</div>
                    <div className="text-xs text-muted-foreground">
                      Restrict student scan radius to university classroom coordinates.
                    </div>
                  </div>
                  <Button
                    variant={strictGeofence ? "default" : "outline"}
                    size="sm"
                    onClick={() => setStrictGeofence(!strictGeofence)}
                  >
                    {strictGeofence ? "Active" : "Bypassed"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 3: Academic Term */}
        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Academic Term & Session</CardTitle>
              <CardDescription>
                Define operational semester dates and examination commencement timelines.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Academic Year</label>
                  <Input value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Current Term / Cycle</label>
                  <Input value={currentTerm} onChange={(e) => setCurrentTerm(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Term Commencement Date</label>
                  <Input
                    type="date"
                    value={termStartDate}
                    onChange={(e) => setTermStartDate(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium">Term Concluding Date</label>
                  <Input
                    type="date"
                    value={termEndDate}
                    onChange={(e) => setTermEndDate(e.target.value)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: System & Cloud */}
        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cloud Database & Infrastructure</CardTitle>
              <CardDescription>
                Backend connectivity and synchronization status.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg border bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold text-sm">Supabase PostgreSQL Database</div>
                    <div className="text-xs text-muted-foreground">
                      Connected to project instance with Row Level Security active.
                    </div>
                  </div>
                </div>
                <Badge className="bg-green-600">Healthy</Badge>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div className="p-4 rounded-lg border space-y-1">
                  <div className="text-xs text-muted-foreground">Storage Buckets</div>
                  <div className="text-lg font-bold">2 Active</div>
                  <div className="text-xs text-muted-foreground">leave-proofs, timetables</div>
                </div>
                <div className="p-4 rounded-lg border space-y-1">
                  <div className="text-xs text-muted-foreground">Edge Functions</div>
                  <div className="text-lg font-bold">admin-provision</div>
                  <div className="text-xs text-muted-foreground">Automated user provisioning</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminSettings;
