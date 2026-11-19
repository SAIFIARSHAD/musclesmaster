
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  AlertCircle,
  CalendarDays,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  LogIn,
  LogOut,
  RefreshCw,
  ScanLine,
  Search,
  ShieldAlert,
  ShieldCheck,
  UserRound,
  Users,
  UserCheck,
  UserX,
  Zap,
} from 'lucide-react';

import QRScanner from '../components/attendance/QRScanner';

import {
  scanMemberQR,
  submitManualAttendance,
  getDailyAttendanceApi,
  getLiveAttendanceApi,
  getAttendanceHistoryApi,
  type QRScanAttendanceResult,
  type ManualAttendanceResult,
} from '../api/attendance.api';

type MainTab = 'mark' | 'logs';
type LogTab = 'daily' | 'live' | 'history';

interface CooldownInfo {
  memberId: string;
  name: string;
  cooldownUntil: string;
}

interface MemberHistorySelection {
  id: string;
  memberId: string;
  name: string;
}

interface AttendanceSession {
  _id?: string;
  attendanceId?: string;
  attendanceDateKey?: string;
  checkInTime: string;
  checkOutTime?: string | null;
  checkInMethod?: string;
  checkOutMethod?: string | null;
  attendanceStatus: string;
  durationMinutes?: number | null;
  isManual?: boolean;
  manualReason?: string | null;
  voidReason?: string | null;
}

interface DailyAttendanceRecord {
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

interface LiveAttendanceRecord {
  attendanceId: string;
  member: {
    _id?: string;
    id?: string;
    memberId: string;
    firstName?: string;
    lastName?: string;
    name?: string;
    mobile?: string;
  };
  attendanceDateKey: string;
  checkInTime: string;
  checkInMethod: string;
  currentDurationMinutes: number;
  isManual: boolean;
  status: string;
}

const today = () => {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
};

const getErrorMessage = (error: unknown) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    return (
      error as {
        response?: { data?: { message?: string } };
      }
    ).response?.data?.message;
  }

  return undefined;
};

// Handles both { success, data: {...} } and direct response shapes.
const getPayload = (response: any) => {
  return response?.data ?? response;
};

const formatTime = (value?: string | null) => {
  if (!value) return '--';

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDate = (value?: string | null) => {
  if (!value) return '--';

  const date = new Date(`${value.slice(0, 10)}T00:00:00`);

  if (Number.isNaN(date.getTime())) return '--';

  return date.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const formatDuration = (minutes = 0) => {
  const safeMinutes = Math.max(0, minutes);
  const hours = Math.floor(safeMinutes / 60);
  const remaining = safeMinutes % 60;

  return hours
    ? `${hours}h ${remaining}m`
    : `${remaining}m`;
};

const getMethodLabel = (method?: string, isManual?: boolean) => {
  if (isManual || method?.toUpperCase() === 'MANUAL') {
    return 'Manual';
  }

  if (method?.toUpperCase() === 'QR') {
    return 'QR Scan';
  }

  return method || '--';
};

const getSessionStatus = (status?: string) => {
  switch (status?.toUpperCase()) {
    case 'CHECKED_IN':
      return 'Checked In';
    case 'CHECKED_OUT':
      return 'Checked Out';
    case 'VOIDED':
      return 'Voided';
    default:
      return status || '--';
  }
};

const getMemberName = (member: LiveAttendanceRecord['member']) => {
  if (member.name) return member.name;

  return `${member.firstName || ''} ${member.lastName || ''}`.trim() || '--';
};

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase();

  const styles =
    normalized === 'present' ||
    normalized === 'checked_out' ||
    normalized === 'checked out'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
      : normalized === 'inside' ||
          normalized === 'checked_in' ||
          normalized === 'checked in'
        ? 'bg-blue-50 text-blue-700 border-blue-200'
        : normalized === 'voided'
          ? 'bg-red-50 text-red-700 border-red-200'
          : 'bg-slate-100 text-slate-600 border-slate-200';

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-bold ${styles}`}
    >
      {getSessionStatus(status)}
    </span>
  );
};

const SummaryCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  subtitle: string;
  icon: React.ElementType;
  color: string;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm font-semibold text-slate-500">{title}</p>
        <p className="mt-2 text-2xl font-extrabold text-slate-900">
          {value.toLocaleString('en-IN')}
        </p>
        <p className="mt-1 text-xs text-slate-400">{subtitle}</p>
      </div>

      <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${color}`}>
        <Icon size={21} />
      </div>
    </div>
  </div>
);

export default function AttendancePage() {
  // Main tabs
  const [mainTab, setMainTab] = useState<MainTab>('mark');
  const [logTab, setLogTab] = useState<LogTab>('daily');

  // QR Attendance states
  const [result, setResult] =
    useState<QRScanAttendanceResult | null>(null);

  const [cooldown, setCooldown] =
    useState<CooldownInfo | null>(null);

  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Manual Attendance states
  const [manualMemberId, setManualMemberId] = useState('');

  const [manualResult, setManualResult] =
    useState<ManualAttendanceResult | null>(null);

  const [manualError, setManualError] = useState('');
  const [manualProcessing, setManualProcessing] = useState(false);

  const [manualCooldown, setManualCooldown] =
    useState<CooldownInfo | null>(null);

  const [manualCooldownSeconds, setManualCooldownSeconds] =
    useState(0);

  // Attendance log states
  const [selectedDate, setSelectedDate] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [dailyRecords, setDailyRecords] =
    useState<DailyAttendanceRecord[]>([]);

  const [liveRecords, setLiveRecords] =
    useState<LiveAttendanceRecord[]>([]);

  const [historyRecords, setHistoryRecords] =
    useState<AttendanceSession[]>([]);

  const [historyMember, setHistoryMember] =
    useState<MemberHistorySelection | null>(null);

  const [historySearch, setHistorySearch] = useState('');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const [summary, setSummary] = useState({
    totalMembers: 0,
    present: 0,
    absent: 0,
    currentlyInside: 0,
  });

  const [loading, setLoading] = useState(false);
  const [logError, setLogError] = useState('');

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // QR cooldown timer
  useEffect(() => {
    if (!cooldown?.cooldownUntil) {
      setCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(cooldown.cooldownUntil).getTime() -
            Date.now()) / 1000,
        ),
      );

      setCooldownSeconds(remaining);
    };

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [cooldown?.cooldownUntil]);

  // Manual cooldown timer
  useEffect(() => {
    if (!manualCooldown?.cooldownUntil) {
      setManualCooldownSeconds(0);
      return;
    }

    const updateCountdown = () => {
      const remaining = Math.max(
        0,
        Math.ceil(
          (new Date(manualCooldown.cooldownUntil).getTime() -
            Date.now()) / 1000,
        ),
      );

      setManualCooldownSeconds(remaining);
    };

    updateCountdown();

    const interval = window.setInterval(updateCountdown, 1000);

    return () => window.clearInterval(interval);
  }, [manualCooldown?.cooldownUntil]);

  // ==============================
  // QR SCAN HANDLER
  // ==============================

  const handleScan = async (qrCode: string) => {
    if (processing) return;

    setProcessing(true);
    setError('');

    try {
      const response = await scanMemberQR(qrCode);

      setResult(response);

      setCooldown({
        memberId: response.member.memberId,
        name: response.member.name,
        cooldownUntil: response.cooldownUntil,
      });
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            data?: {
              cooldownUntil?: string;
              retryAfterSeconds?: number;
              member?: {
                memberId?: string;
                name?: string;
              };
            };
          };
        };
      };

      const responseData = apiError.response?.data?.data;

      if (apiError.response?.status === 429 && responseData) {
        const retrySeconds = responseData.retryAfterSeconds || 120;

        setResult(null);

        setCooldown({
          memberId: responseData.member?.memberId || 'Unknown',
          name: responseData.member?.name || 'Member',
          cooldownUntil:
            responseData.cooldownUntil ||
            new Date(
              Date.now() + retrySeconds * 1000,
            ).toISOString(),
        });

        setError(
          apiError.response?.data?.message ||
            'This member QR code is temporarily blocked.',
        );
      } else {
        setError(
          apiError.response?.data?.message ||
            'Unable to process attendance. Please try again.',
        );
      }
    } finally {
      setProcessing(false);
    }
  };

  // ==============================
  // MANUAL ATTENDANCE HANDLER
  // ==============================

  const handleManualAttendance = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const memberId = manualMemberId.trim().toUpperCase();

    if (!memberId || manualProcessing) return;

    if (
      manualCooldown &&
      manualCooldown.memberId.toUpperCase() === memberId &&
      manualCooldownSeconds > 0
    ) {
      return;
    }

    setManualProcessing(true);
    setManualError('');
    setManualResult(null);

    try {
      const response = await submitManualAttendance(memberId);

      setManualResult(response);

      setManualCooldown({
        memberId: response.member.memberId,
        name: response.member.name,
        cooldownUntil: response.cooldownUntil,
      });

      setManualMemberId('');
    } catch (err: unknown) {
      const apiError = err as {
        response?: {
          status?: number;
          data?: {
            message?: string;
            data?: {
              cooldownUntil?: string;
              retryAfterSeconds?: number;
              member?: {
                memberId?: string;
                name?: string;
              };
            };
          };
        };
      };

      const responseData = apiError.response?.data?.data;

      if (apiError.response?.status === 429 && responseData) {
        const retrySeconds = responseData.retryAfterSeconds || 120;

        setManualCooldown({
          memberId: responseData.member?.memberId || memberId,
          name: responseData.member?.name || 'Member',
          cooldownUntil:
            responseData.cooldownUntil ||
            new Date(Date.now() + retrySeconds * 1000).toISOString(),
        });
      }

      setManualError(
        apiError.response?.data?.message ||
          'Unable to process manual attendance. Please try again.',
      );
    } finally {
      setManualProcessing(false);
    }
  };

  // ==============================
  // DAILY ATTENDANCE API
  // ==============================

  const fetchDailyAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setLogError('');

      const response = await getDailyAttendanceApi({
        date: selectedDate,
        status: statusFilter
          ? (statusFilter as 'present' | 'absent')
          : undefined,
        page,
        limit: 10,
      });

      const payload = getPayload(response);

      setDailyRecords(payload?.attendance || []);

      setSummary((current) => ({
        ...current,
        totalMembers: payload?.summary?.totalMembers || 0,
        present: payload?.summary?.present || 0,
        absent: payload?.summary?.absent || 0,
      }));

      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setLogError(
        getErrorMessage(err) || 'Unable to load daily attendance.',
      );
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, page]);

  // ==============================
  // LIVE ATTENDANCE API
  // ==============================

  const fetchLiveAttendance = useCallback(async () => {
    try {
      setLoading(true);
      setLogError('');

      const response = await getLiveAttendanceApi({
        page,
        limit: 10,
      });

      const payload = getPayload(response);

      setLiveRecords(payload?.liveAttendance || []);

      setSummary((current) => ({
        ...current,
        currentlyInside: payload?.summary?.currentlyInside || 0,
      }));

      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setLogError(
        getErrorMessage(err) || 'Unable to load live attendance.',
      );
    } finally {
      setLoading(false);
    }
  }, [page]);

  // ==============================
  // MEMBER HISTORY API
  // ==============================

  const fetchMemberHistory = useCallback(async () => {
    if (!historyMember?.id) return;

    try {
      setLoading(true);
      setLogError('');

      const response = await getAttendanceHistoryApi(
        historyMember.id,
        {
          startDate: historyStartDate || undefined,
          endDate: historyEndDate || undefined,
          page,
          limit: 10,
        },
      );

      const payload = getPayload(response);

      setHistoryRecords(payload?.attendance || []);
      setTotalPages(payload?.pagination?.totalPages || 1);
    } catch (err: unknown) {
      setLogError(
        getErrorMessage(err) || 'Unable to load member attendance history.',
      );
    } finally {
      setLoading(false);
    }
  }, [historyMember, historyStartDate, historyEndDate, page]);

  // Load active log tab
  useEffect(() => {
    if (mainTab !== 'logs') return;

    if (logTab === 'daily') {
      fetchDailyAttendance();
    } else if (logTab === 'live') {
      fetchLiveAttendance();
    } else if (logTab === 'history' && historyMember) {
      fetchMemberHistory();
    }
  }, [
    mainTab,
    logTab,
    historyMember,
    fetchDailyAttendance,
    fetchLiveAttendance,
    fetchMemberHistory,
  ]);

  // Open member history using the MongoDB member ID
  const openMemberHistory = (record: DailyAttendanceRecord) => {
    setHistoryMember({
      id: record.member.id,
      memberId: record.member.memberId,
      name: record.member.name,
    });

    setHistorySearch(record.member.memberId);
    setHistoryStartDate('');
    setHistoryEndDate('');
    setPage(1);
    setLogError('');
    setLogTab('history');
  };

  const refreshLogs = () => {
    if (logTab === 'daily') {
      fetchDailyAttendance();
    } else if (logTab === 'live') {
      fetchLiveAttendance();
    } else if (logTab === 'history') {
      fetchMemberHistory();
    }
  };

  const filteredDailyRecords = dailyRecords.filter((record) => {
    const query = search.trim().toLowerCase();

    if (!query) return true;

    return (
      record.member.name.toLowerCase().includes(query) ||
      record.member.memberId.toLowerCase().includes(query) ||
      (record.member.mobile || '').toLowerCase().includes(query)
    );
  });

  const formattedTime = (value?: string | null) => {
    if (!value) return '--';

    return new Date(value).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // ==============================
  // MAIN UI
  // ==============================

  return (
    <div className="w-full min-w-0 space-y-6 overflow-x-hidden pb-6">

      {/* PAGE HEADER */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-400">
            <span>Reception</span>
            <span>/</span>
            <span className="text-[#F4510B]">Attendance</span>
          </div>

          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
            Attendance Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Mark member attendance and monitor daily attendance activity.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm">
          <CalendarDays size={17} className="text-[#F4510B]" />
          {new Date().toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
          })}
        </div>
      </div>

      {/* MAIN TABS */}
      <div className="grid grid-cols-2 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => setMainTab('mark')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-sm font-bold transition ${
            mainTab === 'mark'
              ? 'bg-[#F4510B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ScanLine size={19} />
          Mark Attendance
        </button>

        <button
          type="button"
          onClick={() => setMainTab('logs')}
          className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3.5 text-sm font-bold transition ${
            mainTab === 'logs'
              ? 'bg-[#F4510B] text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-50'
          }`}
        >
          <ClipboardList size={19} />
          Attendance Logs
        </button>
      </div>

      {/* ================================= */}
      {/* TAB 1: MARK ATTENDANCE */}
      {/* ================================= */}

      {mainTab === 'mark' && (
        <div className="space-y-5">

          {/* Information cards */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                <ScanLine size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">QR Attendance</p>
                <p className="mt-1 text-xs text-slate-500">Instant QR scanning</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <ShieldCheck size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Cooldown Protection</p>
                <p className="mt-1 text-xs text-slate-500">2-minute scan protection</p>
              </div>
            </div>

            <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Zap size={22} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Auto Detection</p>
                <p className="mt-1 text-xs text-slate-500">Check-in / Check-out</p>
              </div>
            </div>
          </div>

          {/* Mark attendance workspace */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="border-b border-slate-200 p-4 sm:p-5">
              <h2 className="text-lg font-extrabold text-slate-900">
                Mark Member Attendance
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose QR scanning or enter the member ID manually.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 bg-slate-50/60 p-4 sm:p-5 lg:grid-cols-2">

              {/* QR SCANNER */}
              <div className="min-w-0 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-[#F4510B]">
                    <ScanLine size={19} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">QR Scanner</h3>
                    <p className="text-xs text-slate-500">Scan member QR code</p>
                  </div>
                </div>

                <QRScanner onScan={handleScan} />

                {processing && (
                  <div className="flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-3 text-xs font-semibold text-blue-800">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                    Verifying member and processing attendance...
                  </div>
                )}

                {error && !cooldown && (
                  <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
                    <AlertCircle size={17} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {cooldown && !result && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3">
                    <div className="flex items-start gap-2">
                      <ShieldAlert size={18} className="mt-0.5 shrink-0 text-amber-600" />
                      <div>
                        <p className="text-sm font-bold text-amber-900">
                          QR Temporarily Blocked
                        </p>
                        <p className="mt-1 text-xs text-amber-800">
                          {error || 'This member QR code is temporarily blocked.'}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-amber-900">
                          {cooldown.name} · {cooldown.memberId}
                        </p>
                        <p className="mt-1 text-xs text-amber-800">
                          {cooldownSeconds > 0
                            ? `Try again in ${cooldownSeconds} seconds.`
                            : 'Cooldown completed. This QR is ready to scan.'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* MANUAL SCAN */}
              <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
                <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-100 text-[#F4510B]">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900">
                      Manual Attendance
                    </h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Enter Member ID to mark attendance.
                    </p>
                  </div>
                </div>

                <form onSubmit={handleManualAttendance} className="pt-5">
                  <label
                    htmlFor="manual-member-id"
                    className="mb-2 block text-sm font-bold text-slate-800"
                  >
                    Member ID
                  </label>

                  <div className="flex flex-col gap-3">
                    <input
                      id="manual-member-id"
                      type="text"
                      value={manualMemberId}
                      onChange={(event) => setManualMemberId(event.target.value)}
                      placeholder="Enter Member ID (e.g. MM-1025)"
                      autoComplete="off"
                      className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-semibold uppercase text-slate-900 outline-none transition placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-[#F4510B] focus:ring-4 focus:ring-orange-100"
                    />

                    <button
                      type="submit"
                      disabled={
                        manualProcessing ||
                        !manualMemberId.trim() ||
                        Boolean(
                          manualCooldown &&
                          manualCooldown.memberId.toUpperCase() ===
                            manualMemberId.trim().toUpperCase() &&
                          manualCooldownSeconds > 0
                        )
                      }
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {manualProcessing ? (
                        <>
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={18} />
                          Submit Attendance
                        </>
                      )}
                    </button>
                  </div>

                  <p className="mt-3 text-xs leading-5 text-slate-500">
                    System automatically detects whether the member needs check-in or check-out.
                  </p>
                </form>

                {manualError && (
                  <div className="mt-4 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3.5">
                    <AlertCircle size={19} className="mt-0.5 shrink-0 text-red-600" />
                    <div>
                      <p className="text-sm font-bold text-red-800">
                        Attendance not processed
                      </p>
                      <p className="mt-1 text-sm text-red-700">
                        {manualError}
                      </p>
                    </div>
                  </div>
                )}

                {manualCooldown && manualCooldownSeconds > 0 && (
                  <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3.5">
                    <div className="flex items-center gap-3">
                      <ShieldAlert size={20} className="text-amber-600" />
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-bold text-amber-900">
                          Manual Attendance Cooldown
                        </p>
                        <p className="mt-1 text-xs text-amber-800">
                          {manualCooldown.name} ({manualCooldown.memberId}) can submit again after{' '}
                          <strong>{manualCooldownSeconds} seconds</strong>.
                        </p>
                      </div>
                      <span className="text-sm font-extrabold tabular-nums text-amber-800">
                        {manualCooldownSeconds}s
                      </span>
                    </div>
                  </div>
                )}

                {manualResult && (
                  <div className="mt-4 overflow-hidden rounded-xl border border-emerald-200">
                    <div
                      className={`flex items-center gap-3 p-3.5 ${
                        manualResult.action === 'CHECK_IN'
                          ? 'bg-emerald-50'
                          : 'bg-blue-50'
                      }`}
                    >
                      <CheckCircle2
                        size={23}
                        className={
                          manualResult.action === 'CHECK_IN'
                            ? 'text-emerald-600'
                            : 'text-blue-600'
                        }
                      />
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          Manual Attendance Successful
                        </p>
                        <p className="mt-0.5 text-base font-extrabold text-slate-900">
                          {manualResult.action === 'CHECK_IN'
                            ? 'CHECK-IN SUCCESSFUL'
                            : 'CHECK-OUT SUCCESSFUL'}
                        </p>
                      </div>
                    </div>

                    <div className="grid gap-3 p-3.5 sm:grid-cols-2">
                      <div>
                        <p className="text-xs text-slate-500">Member</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {manualResult.member.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {manualResult.member.memberId}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Attendance Time</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {formattedTime(
                            manualResult.action === 'CHECK_IN'
                              ? manualResult.attendance.checkInTime
                              : manualResult.attendance.checkOutTime,
                          )}
                        </p>
                      </div>

                      <div>
                        <p className="text-xs text-slate-500">Branch</p>
                        <p className="mt-1 text-sm font-bold text-slate-900">
                          {manualResult.branch.name}
                        </p>
                      </div>

                      {manualResult.action === 'CHECK_OUT' && (
                        <div>
                          <p className="text-xs text-slate-500">Session Duration</p>
                          <p className="mt-1 text-sm font-bold text-slate-900">
                            {manualResult.attendance.durationMinutes ?? 0} minutes
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 border-t border-orange-100 bg-orange-50 px-3.5 py-3 text-xs font-semibold text-orange-900">
                      <ShieldCheck size={16} className="text-orange-600" />
                      2-minute manual attendance cooldown applied.
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* QR SUCCESS */}
            {result && (
              <div className="border-t border-slate-200 bg-white p-4 sm:p-5">
                <div
                  className={`overflow-hidden rounded-xl border ${
                    result.action === 'CHECK_IN'
                      ? 'border-emerald-200'
                      : 'border-blue-200'
                  }`}
                >
                  <div
                    className={`flex items-center justify-between gap-3 p-4 ${
                      result.action === 'CHECK_IN'
                        ? 'bg-emerald-50'
                        : 'bg-blue-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                          result.action === 'CHECK_IN'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {result.action === 'CHECK_IN' ? (
                          <LogIn size={21} />
                        ) : (
                          <LogOut size={21} />
                        )}
                      </div>
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                          QR Attendance Successful
                        </p>
                        <h3 className="text-lg font-extrabold text-slate-900">
                          {result.action === 'CHECK_IN'
                            ? 'CHECK-IN'
                            : 'CHECK-OUT'}
                        </h3>
                      </div>
                    </div>
                    <CheckCircle2 size={25} className="text-emerald-600" />
                  </div>

                  <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-xs text-slate-500">Member Name</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {result.member.name}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Member ID</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {result.member.memberId}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Branch</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {result.branch.name || '--'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Attendance Time</p>
                      <p className="mt-1 text-sm font-bold text-slate-900">
                        {formattedTime(
                          result.action === 'CHECK_IN'
                            ? result.attendance.checkInTime
                            : result.attendance.checkOutTime,
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-slate-100 bg-orange-50 px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={18} className="shrink-0 text-orange-600" />
                      <p className="flex-1 text-xs font-semibold text-orange-900">
                        {cooldownSeconds > 0
                          ? `This member's QR is protected for another ${cooldownSeconds} seconds.`
                          : 'This member QR is ready to be scanned again.'}
                      </p>
                      <span className="text-sm font-extrabold tabular-nums text-orange-800">
                        {cooldownSeconds}s
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ================================= */}
      {/* TAB 2: ATTENDANCE LOGS */}
      {/* ================================= */}

      {mainTab === 'logs' && (
        <div className="space-y-5">

          {/* LOG SUMMARY CARDS */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryCard
              title="Eligible Members"
              value={summary.totalMembers}
              subtitle="Members eligible today"
              icon={Users}
              color="bg-slate-100 text-slate-600"
            />
            <SummaryCard
              title="Present Today"
              value={summary.present}
              subtitle="Members who visited"
              icon={UserCheck}
              color="bg-emerald-50 text-emerald-600"
            />
            <SummaryCard
              title="Absent Today"
              value={summary.absent}
              subtitle="Members not yet present"
              icon={UserX}
              color="bg-red-50 text-red-600"
            />
            <SummaryCard
              title="Currently Inside"
              value={summary.currentlyInside}
              subtitle="Active gym sessions"
              icon={Activity}
              color="bg-blue-50 text-blue-600"
            />
          </div>

          {/* LOG WORKSPACE */}
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">

            {/* SUB TABS */}
            <div className="flex flex-wrap items-center gap-1 border-b border-slate-200 p-2">
              {([
                { id: 'daily', label: 'Daily Attendance', icon: CalendarDays },
                { id: 'live', label: 'Live Attendance', icon: Activity },
                { id: 'history', label: 'Member History', icon: Clock3 },
              ] as const).map((tab) => {
                const Icon = tab.icon;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => {
                      setLogTab(tab.id);
                      setPage(1);
                      setLogError('');
                    }}
                    className={`inline-flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-bold transition ${
                      logTab === tab.id
                        ? 'bg-orange-50 text-[#F4510B]'
                        : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
                    }`}
                  >
                    <Icon size={17} />
                    {tab.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={refreshLogs}
                disabled={loading}
                className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            <div className="space-y-4 p-4 sm:p-5">

              {/* DAILY ATTENDANCE */}
              {logTab === 'daily' && (
                <>
                  <div className="flex flex-col justify-between gap-3 lg:flex-row lg:items-end">
                    <div>
                      <h2 className="text-lg font-extrabold text-slate-900">
                        Daily Attendance
                      </h2>
                      <p className="mt-1 text-sm text-slate-500">
                        View member attendance for a selected date.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                      <input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value);
                          setPage(1);
                        }}
                        className="rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                      />

                      <select
                        value={statusFilter}
                        onChange={(event) => {
                          setStatusFilter(event.target.value);
                          setPage(1);
                        }}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                      >
                        <option value="">All Status</option>
                        <option value="present">Present</option>
                        <option value="absent">Absent</option>
                      </select>

                      <div className="relative">
                        <Search
                          size={16}
                          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <input
                          type="text"
                          value={search}
                          onChange={(event) => setSearch(event.target.value)}
                          placeholder="Search member..."
                          className="w-full rounded-xl border border-slate-300 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#F4510B]"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Member ID</th>
                          <th className="px-4 py-3">Status</th>
                          <th className="px-4 py-3">Visits</th>
                          <th className="px-4 py-3">Total Duration</th>
                          <th className="px-4 py-3 text-right">Action</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                              Loading daily attendance...
                            </td>
                          </tr>
                        ) : filteredDailyRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                              No attendance records found.
                            </td>
                          </tr>
                        ) : (
                          filteredDailyRecords.map((record) => (
                            <tr key={record.member.id} className="transition hover:bg-slate-50">
                              <td className="px-4 py-3">
                                <p className="font-bold text-slate-900">
                                  {record.member.name}
                                </p>
                                <p className="mt-0.5 text-xs text-slate-400">
                                  {record.member.mobile || '--'}
                                </p>
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {record.member.memberId}
                              </td>

                              <td className="px-4 py-3">
                                <span
                                  className={`inline-flex rounded-full px-2.5 py-1 text-xs font-bold ${
                                    record.status === 'present'
                                      ? 'bg-emerald-50 text-emerald-700'
                                      : 'bg-red-50 text-red-700'
                                  }`}
                                >
                                  {record.status === 'present' ? 'Present' : 'Absent'}
                                </span>
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-700">
                                {record.totalVisits}
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-700">
                                {formatDuration(record.totalDurationMinutes)}
                              </td>

                              <td className="px-4 py-3 text-right">
                                <button
                                  type="button"
                                  onClick={() => openMemberHistory(record)}
                                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B]"
                                >
                                  <Clock3 size={14} />
                                  History
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* LIVE ATTENDANCE */}
              {logTab === 'live' && (
                <>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Live Attendance
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Members who are currently inside the gym.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 rounded-xl border border-blue-200 bg-blue-50 p-3.5">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Activity size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-blue-900">
                        {summary.currentlyInside} Members Currently Inside
                      </p>
                      <p className="mt-1 text-xs text-blue-700">
                        Active check-in sessions in your branch.
                      </p>
                    </div>
                  </div>

                  <div className="overflow-x-auto rounded-xl border border-slate-200">
                    <table className="w-full min-w-[850px] text-left text-sm">
                      <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                        <tr>
                          <th className="px-4 py-3">Member</th>
                          <th className="px-4 py-3">Member ID</th>
                          <th className="px-4 py-3">Check-in Time</th>
                          <th className="px-4 py-3">Duration</th>
                          <th className="px-4 py-3">Method</th>
                          <th className="px-4 py-3">Status</th>
                        </tr>
                      </thead>

                      <tbody className="divide-y divide-slate-100">
                        {loading ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                              Loading live attendance...
                            </td>
                          </tr>
                        ) : liveRecords.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                              No members are currently inside.
                            </td>
                          </tr>
                        ) : (
                          liveRecords.map((record) => (
                            <tr key={record.attendanceId} className="transition hover:bg-slate-50">
                              <td className="px-4 py-3 font-bold text-slate-900">
                                {getMemberName(record.member)}
                              </td>

                              <td className="px-4 py-3 font-semibold text-slate-600">
                                {record.member.memberId}
                              </td>

                              <td className="px-4 py-3 text-slate-700">
                                {formatTime(record.checkInTime)}
                              </td>

                              <td className="px-4 py-3 font-bold text-slate-800">
                                {formatDuration(record.currentDurationMinutes)}
                              </td>

                              <td className="px-4 py-3 text-slate-600">
                                {getMethodLabel(record.checkInMethod, record.isManual)}
                              </td>

                              <td className="px-4 py-3">
                                <StatusBadge status={record.status} />
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* MEMBER HISTORY */}
              {logTab === 'history' && (
                <>
                  <div>
                    <h2 className="text-lg font-extrabold text-slate-900">
                      Member Attendance History
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      View the attendance sessions of a selected member.
                    </p>
                  </div>

                  {!historyMember ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                        <Search size={22} />
                      </div>
                      <h3 className="mt-3 font-bold text-slate-900">
                        Select a member to view history
                      </h3>
                      <p className="mt-1 text-sm text-slate-500">
                        Open Daily Attendance and click History against a member.
                      </p>
                      <button
                        type="button"
                        onClick={() => setLogTab('daily')}
                        className="mt-4 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600"
                      >
                        Go to Daily Attendance
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col justify-between gap-3 rounded-xl border border-orange-100 bg-orange-50/60 p-4 sm:flex-row sm:items-center">
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                            Selected Member
                          </p>
                          <h3 className="mt-1 text-base font-extrabold text-slate-900">
                            {historyMember.name}
                          </h3>
                          <p className="mt-1 text-xs font-semibold text-slate-600">
                            {historyMember.memberId}
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setHistoryMember(null);
                            setHistoryRecords([]);
                            setHistorySearch('');
                            setPage(1);
                          }}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                        >
                          Change Member
                        </button>
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-600">
                            Member ID
                          </label>
                          <input
                            type="text"
                            value={historySearch}
                            readOnly
                            className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-600">
                            Start Date
                          </label>
                          <input
                            type="date"
                            value={historyStartDate}
                            onChange={(event) => {
                              setHistoryStartDate(event.target.value);
                              setPage(1);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                          />
                        </div>

                        <div>
                          <label className="mb-1.5 block text-xs font-bold text-slate-600">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={historyEndDate}
                            min={historyStartDate || undefined}
                            onChange={(event) => {
                              setHistoryEndDate(event.target.value);
                              setPage(1);
                            }}
                            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                          />
                        </div>
                      </div>

                      <div className="overflow-x-auto rounded-xl border border-slate-200">
                        <table className="w-full min-w-[850px] text-left text-sm">
                          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                            <tr>
                              <th className="px-4 py-3">Date</th>
                              <th className="px-4 py-3">Check-in</th>
                              <th className="px-4 py-3">Check-out</th>
                              <th className="px-4 py-3">Duration</th>
                              <th className="px-4 py-3">Method</th>
                              <th className="px-4 py-3">Status</th>
                            </tr>
                          </thead>

                          <tbody className="divide-y divide-slate-100">
                            {loading ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                  Loading member history...
                                </td>
                              </tr>
                            ) : historyRecords.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="px-4 py-12 text-center text-slate-500">
                                  No attendance history found for this member.
                                </td>
                              </tr>
                            ) : (
                              historyRecords.map((session, index) => (
                                <tr
                                  key={session._id || session.attendanceId || index}
                                  className="transition hover:bg-slate-50"
                                >
                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    {formatDate(session.attendanceDateKey)}
                                  </td>

                                  <td className="px-4 py-3 text-slate-700">
                                    {formatTime(session.checkInTime)}
                                  </td>

                                  <td className="px-4 py-3 text-slate-700">
                                    {formatTime(session.checkOutTime)}
                                  </td>

                                  <td className="px-4 py-3 font-semibold text-slate-700">
                                    {session.durationMinutes != null
                                      ? formatDuration(session.durationMinutes)
                                      : '--'}
                                  </td>

                                  <td className="px-4 py-3 text-slate-600">
                                    {getMethodLabel(session.checkInMethod, session.isManual)}
                                  </td>

                                  <td className="px-4 py-3">
                                    <StatusBadge status={session.attendanceStatus} />
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </>
              )}

              {/* ERROR MESSAGE */}
              {logError && (
                <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                  <AlertCircle size={18} className="mt-0.5 shrink-0" />
                  <span>{logError}</span>
                </div>
              )}

              {/* PAGINATION */}
              {logTab !== 'history' || historyMember ? (
                totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                    <p className="text-xs font-medium text-slate-500">
                      Page {page} of {totalPages}
                    </p>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={page <= 1 || loading}
                        onClick={() => setPage((current) => Math.max(1, current - 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        <ChevronLeft size={15} />
                        Previous
                      </button>

                      <button
                        type="button"
                        disabled={page >= totalPages || loading}
                        onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        Next
                        <ChevronRight size={15} />
                      </button>
                    </div>
                  </div>
                )
              ) : null}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
