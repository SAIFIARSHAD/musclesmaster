import { http } from './axiosInstance';

export const getDailyAttendanceApi = async (params: {
  date?: string;
  status?: 'present' | 'absent';
  page?: number;
  limit?: number;
}) => {
  const response = await http.get('/attendance/daily', { params });
  return response.data;
};

export const getLiveAttendanceApi = async (params = {}) => {
  const response = await http.get('/attendance/live', { params });
  return response.data;
};

export const getAttendanceHistoryApi = async (
  memberId: string,
  params = {},
) => {
  const response = await http.get(
    `/attendance/member/${memberId}`,
    { params },
  );
  return response.data;
};

export const createManualAttendanceApi = async (data: {
  memberId: string;
  attendanceDateKey: string;
  checkInTime: string;
  checkOutTime: string;
  reason: string;
}) => {
  const response = await http.post('/attendance/manual', data);
  return response.data;
};

export const updateAttendanceApi = async (
  attendanceId: string,
  data: {
    checkInTime?: string;
    checkOutTime?: string;
    reason: string;
  },
) => {
  const response = await http.put(`/attendance/${attendanceId}`, data);
  return response.data;
};

export const voidAttendanceApi = async (
  attendanceId: string,
  reason: string,
) => {
  const response = await http.patch(
    `/attendance/${attendanceId}/void`,
    { reason },
  );
  return response.data;
};

export const getAttendanceAuditApi = async (
  attendanceId: string,
  params = {},
) => {
  const response = await http.get(
    `/attendance/${attendanceId}/audit`,
    { params },
  );
  return response.data;
};