
import { getIO } from '../config/socket';
import { AttendanceLog } from '../models/AttendanceLog.model';

export const emitAttendanceUpdate = (
  event: 'attendance:check-in' | 'attendance:check-out',
  attendance: {
    _id: unknown;
    branchId: unknown;
    memberId: unknown;
    checkInTime: Date;
    checkOutTime?: Date | null;
    checkInMethod: string;
    checkOutMethod?: string | null;
    attendanceStatus: string;
  },
) => {
  const io = getIO();

  const branchId = String(attendance.branchId);

  // Broadcast attendance update only to the assigned branch.
  io.to(`branch:${branchId}`).emit(event, {
    attendanceId: String(attendance._id),
    branchId,
    memberId: String(attendance.memberId),
    checkInTime: attendance.checkInTime,
    checkOutTime: attendance.checkOutTime ?? null,
    checkInMethod: attendance.checkInMethod,
    checkOutMethod: attendance.checkOutMethod ?? null,
    attendanceStatus: attendance.attendanceStatus,
    emittedAt: new Date().toISOString(),
  });
};
