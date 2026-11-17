import { getIO } from '../config/socket';
export type AttendanceSocketEvent =
  | 'attendance:check-in'
  | 'attendance:check-out'
  | 'attendance:manual-entry'
  | 'attendance:updated'
  | 'attendance:voided';
interface AttendanceSocketPayload {
  _id: unknown;
  attendanceId?: string;
  branchId: unknown;
  memberId: unknown;
  attendanceDateKey: string;
  checkInTime: Date;
  checkOutTime?: Date | null;
  checkInMethod: string;
  checkOutMethod?: string | null;
  attendanceStatus: string;
  durationMinutes?: number | null;
  isManual?: boolean;
  voidedAt?: Date | null;
  voidReason?: string | null;
}

export const emitAttendanceUpdate = (
  event: AttendanceSocketEvent,
  attendance: AttendanceSocketPayload,
) => {
  const io = getIO();

  const branchId = String(attendance.branchId);

  // Send updates only to the relevant branch room.
  io.to(`branch:${branchId}`).emit(event, {
    attendanceId:
      attendance.attendanceId ?? String(attendance._id),

    branchId,
    memberId: String(attendance.memberId),

    attendanceDateKey: attendance.attendanceDateKey,

    checkInTime: attendance.checkInTime,
    checkOutTime: attendance.checkOutTime ?? null,

    checkInMethod: attendance.checkInMethod,
    checkOutMethod: attendance.checkOutMethod ?? null,

    attendanceStatus: attendance.attendanceStatus,
    durationMinutes: attendance.durationMinutes ?? null,

    isManual: attendance.isManual ?? false,

    voidedAt: attendance.voidedAt ?? null,
    voidReason: attendance.voidReason ?? null,

    emittedAt: new Date().toISOString(),
  });
};
