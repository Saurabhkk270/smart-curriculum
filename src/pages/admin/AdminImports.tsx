import { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Upload, AlertTriangle, CheckCircle, XCircle } from "lucide-react";

type ImportRow = {
  id: string;
  enrollmentNo: string;
  name: string;
  rollNo: string;
  email: string;
  course: string;
  branch: string;
  semester: string;
  section: string;
  status: "valid" | "warning" | "error";
  errorMsg?: string;
};

const AdminImports = () => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ImportRow[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rawData = XLSX.utils.sheet_to_json(ws);
        
        validateData(rawData as any[]);
      } catch (err) {
        toast({ title: "Error parsing file", description: "Invalid Excel/CSV format.", variant: "destructive" });
      }
    };
    reader.readAsBinaryString(file);
  };

  const validateData = (rawData: any[]) => {
    const processed: ImportRow[] = rawData.map((row, index) => {
      let status: "valid" | "warning" | "error" = "valid";
      let errorMsg = "";

      const email = row.Email || row.email || "";
      const enrollmentNo = row["Enrollment Number"] || row.enrollmentNo || row.enrollment_no || "";

      if (!email) {
        status = "error";
        errorMsg = "Missing Email";
      } else if (!email.includes("@")) {
        status = "error";
        errorMsg = "Invalid Email";
      }

      if (!enrollmentNo) {
        status = "error";
        errorMsg = errorMsg ? `${errorMsg}, Missing Enrollment No` : "Missing Enrollment No";
      }

      // Basic duplicate check against current batch
      const isDuplicateInBatch = rawData.filter(r => 
        (r["Enrollment Number"] || r.enrollmentNo) === enrollmentNo
      ).length > 1;

      if (isDuplicateInBatch && enrollmentNo) {
        status = "error";
        errorMsg = errorMsg ? `${errorMsg}, Duplicate Enrollment in file` : "Duplicate Enrollment in file";
      }

      return {
        id: `row-${index}`,
        enrollmentNo: enrollmentNo || "",
        name: row.Name || row.name || "",
        rollNo: row["Roll Number"] || row.rollNo || "",
        email: email,
        course: row.Course || row.course || "",
        branch: row.Branch || row.branch || "",
        semester: row.Semester || row.semester || "",
        section: row.Section || row.section || "",
        status,
        errorMsg
      };
    });

    setData(processed);
  };

  const updateRow = (id: string, field: keyof ImportRow, value: string) => {
    setData(prev => prev.map(row => {
      if (row.id === id) {
        const updated = { ...row, [field]: value };
        // Re-validate row simply
        if (!updated.email || !updated.email.includes("@")) {
          updated.status = "error";
          updated.errorMsg = "Invalid Email";
        } else if (!updated.enrollmentNo) {
          updated.status = "error";
          updated.errorMsg = "Missing Enrollment No";
        } else {
          updated.status = "valid";
          updated.errorMsg = "";
        }
        return updated;
      }
      return row;
    }));
  };

  const confirmImport = async () => {
    const validData = data.filter(r => r.status === "valid" || r.status === "warning");
    const errorData = data.filter(r => r.status === "error");

    if (errorData.length > 0) {
      toast({ title: "Cannot Import", description: "Please fix all errors before importing.", variant: "destructive" });
      return;
    }

    setIsImporting(true);

    try {
      const payload = validData.map(row => ({
        email: row.email,
        full_name: row.name,
        student_id: row.enrollmentNo,
        course: row.course,
        branch: row.branch,
        semester: row.semester,
        section: row.section
      }));

      const { data: responseData, error } = await supabase.functions.invoke('admin-provision', {
        body: { users: payload }
      });

      if (error) throw error;

      const results = responseData.results;
      const successes = results.filter((r: any) => r.success).length;
      const failures = results.filter((r: any) => !r.success).length;

      if (failures > 0) {
        toast({ 
          title: "Import Completed with Errors", 
          description: `Created ${successes} accounts. Failed to create ${failures} accounts. Check console for details.`,
          variant: "destructive" 
        });
        console.error("Failed imports:", results.filter((r: any) => !r.success));
      } else {
        toast({ title: "Success", description: `Successfully created ${successes} student records and accounts.` });
        setData([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    } catch (err: any) {
      toast({ title: "Import Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsImporting(false);
    }
  };

  const validCount = data.filter(r => r.status === "valid").length;
  const warningCount = data.filter(r => r.status === "warning").length;
  const errorCount = data.filter(r => r.status === "error").length;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Bulk Import</h2>
        <p className="text-muted-foreground">
          Import students via Excel or CSV. AI validation will check for errors before creating accounts.
        </p>
      </div>

      <div className="flex items-center gap-4">
        <Input 
          type="file" 
          accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
          onChange={handleFileUpload}
          ref={fileInputRef}
          className="max-w-sm"
        />
        <Button onClick={() => fileInputRef.current?.click()} variant="outline">
          <Upload className="mr-2 h-4 w-4" /> Browse
        </Button>
      </div>

      {data.length > 0 && (
        <div className="space-y-4 animate-in fade-in">
          <div className="flex gap-4 p-4 border rounded-lg bg-card">
            <div className="flex items-center text-sm font-medium">
              <span className="text-muted-foreground mr-2">Total Records:</span> {data.length}
            </div>
            <div className="flex items-center text-sm font-medium text-green-600">
              <CheckCircle className="mr-1 h-4 w-4" /> {validCount} Valid
            </div>
            <div className="flex items-center text-sm font-medium text-yellow-600">
              <AlertTriangle className="mr-1 h-4 w-4" /> {warningCount} Warnings
            </div>
            <div className="flex items-center text-sm font-medium text-red-600">
              <XCircle className="mr-1 h-4 w-4" /> {errorCount} Errors
            </div>
            
            <div className="ml-auto">
              <Button onClick={confirmImport} disabled={errorCount > 0 || isImporting}>
                {isImporting ? "Processing..." : "Confirm & Import"}
              </Button>
            </div>
          </div>

          <div className="border rounded-lg bg-card overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Enrollment No</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Branch</TableHead>
                  <TableHead>Semester</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={row.id} className={row.status === 'error' ? 'bg-red-50/50' : ''}>
                    <TableCell>
                      {row.status === 'valid' && <CheckCircle className="h-5 w-5 text-green-500" />}
                      {row.status === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" title={row.errorMsg} />}
                      {row.status === 'error' && <XCircle className="h-5 w-5 text-red-500" title={row.errorMsg} />}
                    </TableCell>
                    <TableCell>
                      <Input value={row.enrollmentNo} onChange={(e) => updateRow(row.id, 'enrollmentNo', e.target.value)} className="h-8 w-28" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.name} onChange={(e) => updateRow(row.id, 'name', e.target.value)} className="h-8 w-32" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.email} onChange={(e) => updateRow(row.id, 'email', e.target.value)} className={`h-8 w-48 ${row.status === 'error' && (!row.email || !row.email.includes('@')) ? 'border-red-500' : ''}`} />
                    </TableCell>
                    <TableCell>
                      <Input value={row.course} onChange={(e) => updateRow(row.id, 'course', e.target.value)} className="h-8 w-20" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.branch} onChange={(e) => updateRow(row.id, 'branch', e.target.value)} className="h-8 w-20" />
                    </TableCell>
                    <TableCell>
                      <Input value={row.semester} onChange={(e) => updateRow(row.id, 'semester', e.target.value)} className="h-8 w-16" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminImports;
