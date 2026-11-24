import { http } from './axiosInstance';
// ==============================
// QR ATTENDANCE TYPES
// ==============================
export interface QRScanAttendanceResult {
  action: 'CHECK_IN' | 'CHECK_OUT';
  member: {
    memberId: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  attendance: {
    _id: string;
    checkInTime: string;
    checkOutTime?: string | null;
    attendanceStatus: string;
    durationMinutes?: number | null;
  };
  cooldownUntil: string;
  retryAfterSeconds: number;
  message?: string;
}

export interface ManualAttendanceResult {
  action: 'CHECK_IN' | 'CHECK_OUT';
  member: {
    memberId: string;
    name: string;
  };
  branch: {
    id: string;
    name: string;
  };
  attendance: {
    _id: string;
    checkInTime: string;
    checkOutTime?: string | null;
    attendanceStatus: string;
    durationMinutes?: number | null;
  };
  cooldownUntil: string;
  retryAfterSeconds: number;
  message?: string;
}

interface QRScanApiResponse {
  success: boolean;
  message: string;
  data: QRScanAttendanceResult;
}

interface ManualAttendanceApiResponse {
  success: boolean;
  message: string;
  data: ManualAttendanceResult;
}

// ==============================
// DASHBOARD API TYPES
// ==============================

export interface AttendanceQueryParams {
  page?: number;
  limit?: number;
}

export interface DailyAttendanceParams extends AttendanceQueryParams {
  date?: string;
  status?: 'present' | 'absent';
}

export interface MemberHistoryParams extends AttendanceQueryParams {
  startDate?: string;
  endDate?: string;
}

// ==============================
// QR SCAN
// ==============================

export const scanMemberQR = async (
  qrCode: string,
): Promise<QRScanAttendanceResult> => {
  const response = await http.post<QRScanApiResponse>(
    '/attendance/qr-scan',
    { qrCode },
  );

  return {
    ...response.data.data,
    message: response.data.message,
  };
};

// ==============================
// MANUAL MEMBER SCAN
// ==============================

export const submitManualAttendance = async (
  memberId: string,
): Promise<ManualAttendanceResult> => {
  const response = await http.post<ManualAttendanceApiResponse>(
    '/attendance/manual-scan',
    { memberId },
  );

  return {
    ...response.data.data,
    message: response.data.message,
  };
};

// ==============================
// DAILY ATTENDANCE
// ==============================

export const getDailyAttendanceApi = async (
  params: DailyAttendanceParams = {},
) => {
  const response = await http.get('/attendance/daily', { params });
  return response.data;
};

// ==============================
// LIVE ATTENDANCE
// ==============================

export const getLiveAttendanceApi = async (
  params: AttendanceQueryParams = {},
) => {
  const response = await http.get('/attendance/live', { params });
  return response.data;
};

// ==============================
// MEMBER ATTENDANCE HISTORY
// ==============================

export const getAttendanceHistoryApi = async (
  memberId: string,
  params: MemberHistoryParams = {},
) => {
  const response = await http.get(
    `/attendance/member/${encodeURIComponent(memberId)}`,
    { params },
  );

  return response.data;
};
