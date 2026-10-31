
import axiosInstance from './axiosInstance';

export interface WorkingHours {
  start: string;
  end: string;
}

export interface AttendanceWindow {
  checkInStart: string;
  checkInEnd: string;
  checkOutStart: string;
  checkOutEnd: string;
}

export interface BranchSettings {
  _id?: string;
  branchId: string;
  timezone: string;
  currency: string;
  workingHours: WorkingHours;
  attendanceWindow: AttendanceWindow;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateBranchSettingsPayload {
  timezone?: string;
  currency?: string;
  workingHours?: WorkingHours;
  attendanceWindow?: AttendanceWindow;
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const getBranchSettingsApi = async (
  branchId: string,
): Promise<BranchSettings> => {
  const response = await axiosInstance.get<ApiResponse<BranchSettings>>(
    `/branches/${branchId}/settings`,
  );

  return response.data.data;
};

export const updateBranchSettingsApi = async (
  branchId: string,
  payload: UpdateBranchSettingsPayload,
): Promise<BranchSettings> => {
  const response = await axiosInstance.put<ApiResponse<BranchSettings>>(
    `/branches/${branchId}/settings`,
    payload,
  );

  return response.data.data;
};
