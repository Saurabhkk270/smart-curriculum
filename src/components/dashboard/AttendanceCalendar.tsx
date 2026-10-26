import { useState, useEffect, useMemo } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthProvider';
import { format, isSameDay, parseISO, isAfter, isBefore, startOfToday } from 'date-fns';
import { 
  CalendarDays, 
  CheckCircle2, 
  PartyPopper, 
  Search, 
  Landmark, 
  Sparkles, 
  Building2, 
  Calendar as CalendarIcon,
  Clock,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayContentProps } from 'react-day-picker';
import { INDIAN_NATIONAL_AND_STATE_HOLIDAYS, UniversityHoliday } from '@/data/holidays';

interface AttendanceDay {
  date: Date;
  classId: string;
  className: string;
}

interface HolidayItem {
  date: Date;
  dateStr: string;
  name: string;
  type: 'national' | 'gazetted' | 'state' | 'university';
  description: string;
}

const AttendanceCalendar = () => {
  const { profile } = useAuth();
  const [selectedClass, setSelectedClass] = useState<string>('all');
  const [classes, setClasses] = useState<any[]>([]);
  const [attendanceDays, setAttendanceDays] = useState<AttendanceDay[]>([]);
  const [holidays, setHolidays] = useState<HolidayItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [searchHoliday, setSearchHoliday] = useState<string>('');
  const [holidayYearFilter, setHolidayYearFilter] = useState<string>('2026');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEnrolledClasses();
    fetchHolidays();
  }, []);

  useEffect(() => {
    if (profile?.id) {
      fetchAttendanceDays();
    }
  }, [selectedClass, profile?.id]);

  const fetchEnrolledClasses = async () => {
    try {
      const { data: enrollments } = await supabase
        .from('class_enrollments')
        .select('class_id, classes(id, name, code)')
        .eq('student_id', profile?.id);

      if (enrollments) {
        const classData = enrollments.map((e: any) => e.classes).filter(Boolean);
        setClasses(classData);
      }
    } catch (e) {
      console.error('Error fetching enrolled classes:', e);
    }
  };

  const fetchHolidays = async () => {
    // 1. Convert built-in authoritative Indian National & State Holidays
    const baseHolidays: HolidayItem[] = INDIAN_NATIONAL_AND_STATE_HOLIDAYS.map((h) => ({
      date: parseISO(h.date),
      dateStr: h.date,
      name: h.name,
      type: h.type,
      description: h.description,
    }));

    // 2. Fetch any custom holidays from Supabase to merge
    try {
      const { data } = await supabase
        .from('holidays')
        .select('date, name')
        .order('date');

      if (data && data.length > 0) {
        const map = new Map<string, HolidayItem>();
        baseHolidays.forEach((h) => map.set(h.dateStr, h));

        data.forEach((d: any) => {
          if (!map.has(d.date)) {
            map.set(d.date, {
              date: parseISO(d.date),
              dateStr: d.date,
              name: d.name,
              type: 'gazetted',
              description: 'Official University Gazetted Holiday',
            });
          }
        });

        setHolidays(Array.from(map.values()).sort((a, b) => a.date.getTime() - b.date.getTime()));
        return;
      }
    } catch (err) {
      console.error('Error fetching holidays from Supabase, using authoritative holiday dataset:', err);
    }

    setHolidays(baseHolidays);
  };

  const fetchAttendanceDays = async () => {
    setLoading(true);
    try {
      const query = supabase
        .from('attendance_records')
        .select(`
          marked_at,
          session:attendance_sessions(
            class_id,
            class:classes(id, name)
          )
        `)
        .eq('student_id', profile?.id);

      const { data } = await query;

      if (data) {
        const days: AttendanceDay[] = data
          .filter((record: any) => {
            if (selectedClass === 'all') return true;
            return record.session?.class_id === selectedClass;
          })
          .map((record: any) => ({
            date: parseISO(record.marked_at),
            classId: record.session?.class_id || '',
            className: record.session?.class?.name || 'Class Lecture',
          }));

        setAttendanceDays(days);
      }
    } catch (e) {
      console.error('Error fetching attendance records:', e);
    } finally {
      setLoading(false);
    }
  };

  const isAttendanceDay = (date: Date) => {
    return attendanceDays.some((ad) => isSameDay(ad.date, date));
  };

  const getHolidayForDate = (date: Date): HolidayItem | undefined => {
    return holidays.find((h) => isSameDay(h.date, date));
  };

  const getAttendanceForDate = (date: Date) => {
    return attendanceDays.filter((ad) => isSameDay(ad.date, date));
  };

  // Custom DayContent cell renderer
  const DayContent = (props: DayContentProps) => {
    const { date } = props;
    const hasAttendance = isAttendanceDay(date);
    const holiday = getHolidayForDate(date);
    const isNational = holiday?.type === 'national';
    const isState = holiday?.type === 'state';
    const isUni = holiday?.type === 'university';

    return (
      <div className="relative w-full h-full min-h-[38px] flex items-center justify-center p-0.5">
        <span
          className={cn(
            'relative z-10 text-xs font-semibold transition-colors',
            hasAttendance && 'font-black text-white',
            holiday && !hasAttendance && (isNational ? 'text-orange-950 font-black' : 'text-amber-900 font-bold')
          )}
        >
          {format(date, 'd')}
        </span>

        {/* Attendance Highlight (Emerald Green) */}
        {hasAttendance && (
          <div className="absolute inset-0 bg-emerald-600 rounded-lg flex items-center justify-center shadow-xs">
            <CheckCircle2 className="w-2.5 h-2.5 text-white absolute top-0.5 right-0.5" />
          </div>
        )}

        {/* National / State / University Holiday Highlight */}
        {holiday && !hasAttendance && (
          <div
            className={cn(
              'absolute inset-0 rounded-lg flex items-center justify-center transition-all',
              isNational
                ? 'bg-orange-100/90 border-2 border-orange-500 shadow-xs'
                : isState
                ? 'bg-amber-100/80 border border-amber-400'
                : isUni
                ? 'bg-purple-100/80 border border-purple-400'
                : 'bg-yellow-100/80 border border-yellow-400'
            )}
          >
            <span className="text-[9px] absolute top-0.5 right-0.5 leading-none">
              {isNational ? '🇮🇳' : isUni ? '🏛️' : '⭐'}
            </span>
          </div>
        )}
      </div>
    );
  };

  const selectedDateInfo = selectedDate
    ? {
        attendance: getAttendanceForDate(selectedDate),
        holiday: getHolidayForDate(selectedDate),
      }
    : null;

  // Filtered holidays list for the side directory
  const today = startOfToday();
  const filteredHolidays = useMemo(() => {
    return holidays.filter((h) => {
      const matchesYear = holidayYearFilter === 'all' || format(h.date, 'yyyy') === holidayYearFilter;
      const matchesSearch =
        !searchHoliday ||
        h.name.toLowerCase().includes(searchHoliday.toLowerCase()) ||
        h.description.toLowerCase().includes(searchHoliday.toLowerCase());
      return matchesYear && matchesSearch;
    });
  }, [holidays, holidayYearFilter, searchHoliday]);

  return (
    <div className="space-y-6">
      {/* Top Filter & Institutional Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-700">Subject Filter:</label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger className="w-full sm:w-[240px] h-9 text-xs bg-white border-slate-300">
              <SelectValue placeholder="All Subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Enrolled Subjects</SelectItem>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.id}>
                  {cls.name} ({cls.code})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-white border border-slate-200 rounded-md">
            <span className="h-3 w-3 rounded-full bg-emerald-600 inline-block" />
            <span className="font-semibold text-slate-700">Class Attended</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-orange-50 border border-orange-300 rounded-md">
            <span>🇮🇳</span>
            <span className="font-semibold text-orange-900">National Holiday</span>
          </div>
          <div className="flex items-center gap-1.5 px-2 py-1 bg-amber-50 border border-amber-300 rounded-md">
            <span>⭐</span>
            <span className="font-semibold text-amber-900">Gazetted / State</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Calendar on Left, Holiday Directory on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Month Calendar */}
        <div className="lg:col-span-7 space-y-4">
          <Card className="border border-slate-200/90 shadow-sm bg-white overflow-hidden rounded-xl">
            <CardHeader className="bg-slate-50/70 border-b border-slate-200 py-3.5 px-5">
              <CardTitle className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-blue-700" />
                Monthly Attendance & Recess Calendar
              </CardTitle>
              <CardDescription className="text-xs text-slate-500">
                Click on any date to inspect lecture attendance logs or official holiday proclamations.
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 flex justify-center">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-xl border border-slate-200 p-3 sm:p-4 bg-white pointer-events-auto shadow-xs"
                components={{
                  DayContent,
                }}
              />
            </CardContent>
          </Card>

          {/* Selected Date Information Card */}
          {selectedDateInfo && (
            <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden rounded-xl">
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Day Audit: {format(selectedDate!, 'EEEE, MMMM dd, yyyy')}
                  </span>
                </div>
                {selectedDateInfo.holiday && (
                  <Badge className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] uppercase font-bold">
                    Official Holiday
                  </Badge>
                )}
              </div>

              <CardContent className="p-5 space-y-3">
                {/* 1. If it's a Holiday */}
                {selectedDateInfo.holiday && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-amber-50 via-orange-50 to-amber-50 border border-amber-300 shadow-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">
                          {selectedDateInfo.holiday.type === 'national' ? '🇮🇳' : '⭐'}
                        </span>
                        <h4 className="font-extrabold text-base text-amber-950">
                          {selectedDateInfo.holiday.name}
                        </h4>
                      </div>
                      <Badge className="bg-amber-200 text-amber-900 border-amber-300 text-[10px] font-bold uppercase">
                        {selectedDateInfo.holiday.type === 'national'
                          ? 'Gazetted National Holiday'
                          : selectedDateInfo.holiday.type === 'state'
                          ? 'Haryana State Holiday'
                          : selectedDateInfo.holiday.type === 'university'
                          ? 'SVSU University Observance'
                          : 'Gazetted Holiday'}
                      </Badge>
                    </div>
                    <p className="text-xs text-amber-900 leading-relaxed font-medium">
                      {selectedDateInfo.holiday.description}
                    </p>
                    <div className="pt-2 border-t border-amber-200 flex items-center gap-2 text-[11px] text-amber-800 font-semibold">
                      <Building2 className="w-3.5 h-3.5" />
                      <span>Shri Vishwakarma Skill University Campus & Classes are Closed</span>
                    </div>
                  </div>
                )}

                {/* 2. If Attendance Recorded */}
                {selectedDateInfo.attendance.length > 0 ? (
                  <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 shadow-xs space-y-2">
                    <div className="flex items-center gap-2 text-emerald-800 font-bold text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Verified Lecture Attendance Logged</span>
                    </div>
                    <div className="space-y-1.5 pt-1">
                      {selectedDateInfo.attendance.map((att, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between p-2 rounded-lg bg-white border border-emerald-200 text-xs"
                        >
                          <span className="font-bold text-slate-800">{att.className}</span>
                          <span className="text-emerald-700 font-semibold">Present (Logged ✓)</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  !selectedDateInfo.holiday && (
                    <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-center text-xs text-slate-500">
                      <p className="font-medium text-slate-700">Instructional Working Day</p>
                      <p className="text-[11px] mt-0.5">No lecture attendance marked on this date.</p>
                    </div>
                  )
                )}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column: Full Annual National & Government Holiday Directory */}
        <div className="lg:col-span-5 space-y-4">
          <Card className="border border-slate-200/90 shadow-sm bg-white overflow-hidden rounded-xl flex flex-col h-full max-h-[720px]">
            <CardHeader className="bg-slate-900 text-white py-3.5 px-5 border-b border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-bold text-white flex items-center gap-2">
                    <Landmark className="w-4 h-4 text-amber-400" />
                    Gazetted National & State Holidays
                  </CardTitle>
                  <CardDescription className="text-xs text-slate-300 mt-0.5">
                    Official Government of India & Haryana Academic Recess Schedule
                  </CardDescription>
                </div>
              </div>
            </CardHeader>

            <div className="p-3.5 border-b border-slate-200 bg-slate-50/80 space-y-2.5">
              {/* Year Filters */}
              <div className="flex items-center gap-1.5">
                {['2026', '2027', '2025', 'all'].map((yr) => (
                  <Button
                    key={yr}
                    size="sm"
                    variant={holidayYearFilter === yr ? 'default' : 'outline'}
                    onClick={() => setHolidayYearFilter(yr)}
                    className={cn(
                      'text-xs h-7 px-2.5 font-bold',
                      holidayYearFilter === yr
                        ? 'bg-blue-700 hover:bg-blue-800 text-white'
                        : 'border-slate-300 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    {yr === 'all' ? 'All Years' : yr}
                  </Button>
                ))}
              </div>

              {/* Search Box */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                <Input
                  placeholder="Search holiday by name (e.g. Diwali, Holi)..."
                  value={searchHoliday}
                  onChange={(e) => setSearchHoliday(e.target.value)}
                  className="pl-8 text-xs h-8 bg-white border-slate-300 rounded-md"
                />
              </div>
            </div>

            {/* Scrollable Holiday List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-2 divide-y divide-slate-100">
              {filteredHolidays.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No holidays match your search filter.
                </div>
              ) : (
                filteredHolidays.map((holiday, idx) => {
                  const isPast = isBefore(holiday.date, today);
                  const isSelected = selectedDate && isSameDay(holiday.date, selectedDate);
                  const isNational = holiday.type === 'national';

                  return (
                    <div
                      key={idx}
                      onClick={() => setSelectedDate(holiday.date)}
                      className={cn(
                        'pt-2 first:pt-0 p-2.5 rounded-lg cursor-pointer transition-all flex items-start justify-between gap-3',
                        isSelected
                          ? 'bg-blue-50 border border-blue-300 shadow-xs'
                          : 'hover:bg-slate-50'
                      )}
                    >
                      <div className="flex items-start gap-2.5 min-w-0">
                        {/* Date badge */}
                        <div
                          className={cn(
                            'h-11 w-11 rounded-lg flex flex-col items-center justify-center shrink-0 font-bold border',
                            isNational
                              ? 'bg-orange-100 border-orange-300 text-orange-950'
                              : 'bg-slate-100 border-slate-200 text-slate-800'
                          )}
                        >
                          <span className="text-[10px] uppercase font-bold leading-none">
                            {format(holiday.date, 'MMM')}
                          </span>
                          <span className="text-sm font-black leading-tight">
                            {format(holiday.date, 'dd')}
                          </span>
                        </div>

                        <div className="min-w-0">
                          <h5 className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                            {isNational && <span>🇮🇳</span>}
                            {holiday.name}
                          </h5>
                          <p className="text-[11px] text-slate-500 truncate mt-0.5">
                            {holiday.description}
                          </p>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {format(holiday.date, 'EEEE, yyyy')}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0 text-right">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-[9px] font-bold uppercase tracking-wider',
                            isNational
                              ? 'border-orange-400 text-orange-800 bg-orange-50'
                              : holiday.type === 'state'
                              ? 'border-amber-400 text-amber-800 bg-amber-50'
                              : holiday.type === 'university'
                              ? 'border-purple-400 text-purple-800 bg-purple-50'
                              : 'border-slate-300 text-slate-700 bg-slate-50'
                          )}
                        >
                          {holiday.type}
                        </Badge>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer Summary */}
            <div className="p-3 border-t border-slate-200 bg-slate-50 text-[11px] text-slate-600 flex items-center justify-between font-medium">
              <span>Total Gazetted Holidays: {filteredHolidays.length}</span>
              <span className="text-blue-700 font-semibold">SVSU Academic Calendar</span>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AttendanceCalendar;
