export type AttendanceTab = 'daily' | 'live' | 'history';

export interface AttendanceMember {
  _id?: string;
  id?: string;
  memberId: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  mobile?: string;
  email?: string;
}

export interface AttendanceSession {
  _id: string;
  attendanceId?: string;
  checkInTime: string;
  checkOutTime?: string | null;
  checkInMethod: string;
  checkOutMethod?: string | null;
  attendanceStatus: 'CHECKED_IN' | 'CHECKED_OUT' | 'VOIDED';
  durationMinutes?: number | null;
  isManual?: boolean;
  manualReason?: string | null;
  voidReason?: string | null;
  voidedAt?: string | null;
}

export interface DailyAttendanceRecord {
  member: {
    id: string;
    memberId: string;
    name: string;
    mobile?: string;
  };
  date: string;
  status: 'present' | 'absent';
  totalVisits: number;
  totalDurationMinutes: number;
  sessions: AttendanceSession[];
}

export interface DailyAttendanceResponse {
  success: boolean;
  data: {
    attendance: DailyAttendanceRecord[];
    summary: {
      totalMembers: number;
      present: number;
      absent: number;
    };
    pagination: {
      currentPage: number;
      totalPages: number;
      totalRecords: number;
      limit: number;
    };
  };
}

export interface LiveAttendanceRecord {
  attendanceId: string;
  member: AttendanceMember;
  attendanceDateKey: string;
  checkInTime: string;
  checkInMethod: string;
  currentDurationMinutes: number;
  isManual: boolean;
  status: string;
}

export interface MemberOption {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  mobile?: string;
}
