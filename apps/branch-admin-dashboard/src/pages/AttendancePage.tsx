
import { useCallback, useEffect, useState } from 'react';
import {
  Activity,
  CalendarDays,
  Users,
  UserCheck,
  UserX,
  RefreshCw,
  Search,
  Plus,
  Eye,
  Pencil,
  Ban,
  History,
  ChevronLeft,
  ChevronRight,
  X,
  ClipboardList,
} from 'lucide-react';

import {
  getDailyAttendanceApi,
  getLiveAttendanceApi,
  getAttendanceHistoryApi,
  createManualAttendanceApi,
  updateAttendanceApi,
  voidAttendanceApi,
  getAttendanceAuditApi,
} from '../api/attendance.api';

import { getMembersApi } from '../api/members.api';

import type {
  AttendanceTab,
  DailyAttendanceRecord,
  AttendanceSession,
  LiveAttendanceRecord,
  MemberOption,
} from '../types/attendance.types';

const today = () => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
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

const formatTime = (value?: string | null) => {
  if (!value) return '—';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes = 0) => {
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return hours ? `${hours}h ${remaining}m` : `${remaining}m`;
};

const formatDate = (value: string) => {
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

const AttendancePage = () => {
  const [activeTab, setActiveTab] = useState<AttendanceTab>('daily');
  const [selectedDate, setSelectedDate] = useState(today());
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');

  const [dailyRecords, setDailyRecords] = useState<DailyAttendanceRecord[]>([]);
  const [liveRecords, setLiveRecords] = useState<LiveAttendanceRecord[]>([]);
  const [members, setMembers] = useState<MemberOption[]>([]);
  const [history, setHistory] = useState<AttendanceSession[]>([]);
  const [historyMember, setHistoryMember] = useState('');

  const [summary, setSummary] = useState({
    totalMembers: 0,
    present: 0,
    absent: 0,
    currentlyInside: 0,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [manualOpen, setManualOpen] = useState(false);
  const [editSession, setEditSession] = useState<AttendanceSession | null>(null);
  const [voidSession, setVoidSession] = useState<AttendanceSession | null>(null);
  const [auditSession, setAuditSession] = useState<AttendanceSession | null>(null);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  const [form, setForm] = useState({
    memberId: '',
    attendanceDateKey: '',
    checkInTime: '',
    checkOutTime: '',
    reason: '',
  });

  const [editForm, setEditForm] = useState({
    checkInTime: '',
    checkOutTime: '',
    reason: '',
  });

  const [voidReason, setVoidReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadMembers = useCallback(async () => {
    try {
      const response = await getMembersApi({
        page: 1,
        limit: 100,
        status: 'ACTIVE',
      });

      setMembers(response.data || []);
    } catch (err) {
      console.error('Unable to load members:', err);
    }
  }, []);

  const fetchDaily = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getDailyAttendanceApi({
        date: selectedDate,
        status: statusFilter
          ? (statusFilter as 'present' | 'absent')
          : undefined,
        page,
        limit: 10,
      });

      setDailyRecords(response.data.attendance || []);
      setSummary((current) => ({
        ...current,
        totalMembers: response.data.summary.totalMembers,
        present: response.data.summary.present,
        absent: response.data.summary.absent,
      }));
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err) || 'Unable to load daily attendance.');
    } finally {
      setLoading(false);
    }
  }, [selectedDate, statusFilter, page]);

  const fetchLive = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const response = await getLiveAttendanceApi({
        page,
        limit: 10,
      });

      setLiveRecords(response.data.liveAttendance || []);
      setSummary((current) => ({
        ...current,
        currentlyInside: response.data.summary.currentlyInside,
      }));
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err) || 'Unable to load live attendance.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  const fetchHistory = useCallback(async () => {
    if (!historyMember) {
      setHistory([]);
      return;
    }

    try {
      setLoading(true);
      setError('');

      const response = await getAttendanceHistoryApi(historyMember, {
        page,
        limit: 10,
      });

      setHistory(response.data.attendance || []);
      setTotalPages(response.data.pagination.totalPages || 1);
    } catch (err) {
      setError(getErrorMessage(err) || 'Unable to load attendance history.');
    } finally {
      setLoading(false);
    }
  }, [historyMember, page]);

  useEffect(() => {
    loadMembers();
  }, [loadMembers]);

  useEffect(() => {
    setPage(1);
  }, [activeTab, selectedDate, statusFilter, historyMember]);

  useEffect(() => {
    if (activeTab === 'daily') fetchDaily();
    if (activeTab === 'live') fetchLive();
    if (activeTab === 'history') fetchHistory();
  }, [activeTab, fetchDaily, fetchLive, fetchHistory]);

  const refresh = () => {
    if (activeTab === 'daily') fetchDaily();
    if (activeTab === 'live') fetchLive();
    if (activeTab === 'history') fetchHistory();
  };

  const openManual = () => {
    setForm({
      memberId: '',
      attendanceDateKey: '',
      checkInTime: '',
      checkOutTime: '',
      reason: '',
    });
    setManualOpen(true);
  };

  const submitManual = async (event: React.FormEvent) => {
    event.preventDefault();

    try {
      setSaving(true);

      await createManualAttendanceApi({
        ...form,
        checkInTime: new Date(form.checkInTime).toISOString(),
        checkOutTime: new Date(form.checkOutTime).toISOString(),
      });

      setManualOpen(false);
      setActiveTab('daily');
      fetchDaily();
    } catch (err) {
      alert(getErrorMessage(err) || 'Unable to create manual attendance.');
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (session: AttendanceSession) => {
    setEditSession(session);
    setEditForm({
      checkInTime: session.checkInTime
        ? new Date(session.checkInTime).toISOString().slice(0, 16)
        : '',
      checkOutTime: session.checkOutTime
        ? new Date(session.checkOutTime).toISOString().slice(0, 16)
        : '',
      reason: '',
    });
  };

  const submitEdit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editSession) return;

    try {
      setSaving(true);

      await updateAttendanceApi(editSession._id, {
        checkInTime: new Date(editForm.checkInTime).toISOString(),
        checkOutTime: editForm.checkOutTime
          ? new Date(editForm.checkOutTime).toISOString()
          : undefined,
        reason: editForm.reason,
      });

      setEditSession(null);
      refresh();
    } catch (err) {
      alert(getErrorMessage(err) || 'Unable to update attendance.');
    } finally {
      setSaving(false);
    }
  };

  const submitVoid = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!voidSession) return;

    try {
      setSaving(true);
      await voidAttendanceApi(voidSession._id, voidReason);
      setVoidSession(null);
      setVoidReason('');
      refresh();
    } catch (err) {
      alert(getErrorMessage(err) || 'Unable to void attendance.');
    } finally {
      setSaving(false);
    }
  };

  const openAudit = async (session: AttendanceSession) => {
    setAuditSession(session);
    setAuditLoading(true);
    setAuditLogs([]);

    try {
      const response = await getAttendanceAuditApi(session._id, {
        page: 1,
        limit: 50,
      });
      setAuditLogs(response.data.auditHistory || []);
    } catch (err) {
      alert(getErrorMessage(err) || 'Unable to load audit history.');
    } finally {
      setAuditLoading(false);
    }
  };

  const filteredDaily = dailyRecords.filter((record) => {
    const text = `${record.member.name} ${record.member.memberId} ${record.member.mobile || ''}`;
    return text.toLowerCase().includes(search.toLowerCase());
  });

  const filteredLive = liveRecords.filter((record) => {
    const member = record.member;
    const name = member.name || `${member.firstName || ''} ${member.lastName || ''}`;
    return `${name} ${member.memberId}`.toLowerCase().includes(search.toLowerCase());
  });

  const tabs: { id: AttendanceTab; label: string; icon: React.ElementType }[] = [
    { id: 'daily', label: 'Daily Attendance', icon: CalendarDays },
    { id: 'live', label: 'Live Attendance', icon: Activity },
    { id: 'history', label: 'Member History', icon: History },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-[#14243B]">
            Attendance Management
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Track gym visits, member sessions and attendance records.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={refresh}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            onClick={openManual}
            className="inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#dc4508]"
          >
            <Plus size={17} />
            Manual Attendance
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Eligible Members" value={summary.totalMembers} icon={<Users />} />
        <SummaryCard title="Present Today" value={summary.present} icon={<UserCheck />} />
        <SummaryCard title="Absent Today" value={summary.absent} icon={<UserX />} />
        <SummaryCard title="Currently Inside" value={summary.currentlyInside} icon={<Activity />} />
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? 'bg-[#14243B] text-white'
                  : 'text-slate-500 hover:bg-slate-50'
              }`}
            >
              <Icon size={17} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="font-semibold text-[#14243B]">
              {activeTab === 'daily' && 'Daily Member Attendance'}
              {activeTab === 'live' && 'Members Currently Inside'}
              {activeTab === 'history' && 'Member Attendance History'}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              {activeTab === 'daily' && `Attendance for ${formatDate(selectedDate)}`}
              {activeTab === 'live' && 'Active check-in sessions'}
              {activeTab === 'history' && 'All recorded visits for selected member'}
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            {activeTab === 'daily' && (
              <>
                <input
                  type="date"
                  value={selectedDate}
                  max={today()}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                />
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
                >
                  <option value="">All Members</option>
                  <option value="present">Present</option>
                  <option value="absent">Absent</option>
                </select>
              </>
            )}

            {activeTab === 'history' && (
              <select
                value={historyMember}
                onChange={(event) => setHistoryMember(event.target.value)}
                className="min-w-64 rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[#F4510B]"
              >
                <option value="">Select a member</option>
                {members.map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.firstName} {member.lastName} — {member.memberId}
                  </option>
                ))}
              </select>
            )}

            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search member..."
                className="w-full rounded-xl border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-[#F4510B] sm:w-52"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="m-4 rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
            {error}
            <button onClick={refresh} className="ml-3 font-semibold underline">
              Retry
            </button>
          </div>
        )}

        {activeTab === 'daily' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Member</Th>
                  <Th>Member ID</Th>
                  <Th>Status</Th>
                  <Th>Total Visits</Th>
                  <Th>Total Duration</Th>
                  <Th>Sessions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRow columns={6} />
                ) : filteredDaily.length === 0 ? (
                  <EmptyRow columns={6} message="No attendance records found." />
                ) : (
                  filteredDaily.map((record) => (
                    <tr key={record.member.id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4">
                        <p className="font-semibold text-slate-800">{record.member.name}</p>
                        <p className="text-xs text-slate-500">{record.member.mobile || '—'}</p>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-600">{record.member.memberId}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={record.status} />
                      </td>
                      <td className="px-4 py-4 text-sm font-semibold text-slate-700">{record.totalVisits}</td>
                      <td className="px-4 py-4 text-sm text-slate-600">{formatDuration(record.totalDurationMinutes)}</td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-2">
                          {record.sessions.map((session) => (
                            <SessionActions
                              key={session._id}
                              session={session}
                              onEdit={openEdit}
                              onVoid={setVoidSession}
                              onAudit={openAudit}
                            />
                          ))}
                          {record.sessions.length === 0 && (
                            <span className="text-xs text-slate-400">No visits</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'live' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Member</Th>
                  <Th>Member ID</Th>
                  <Th>Check-in Time</Th>
                  <Th>Current Duration</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRow columns={6} />
                ) : filteredLive.length === 0 ? (
                  <EmptyRow columns={6} message="No members are currently inside." />
                ) : (
                  filteredLive.map((record) => {
                    const name = record.member.name ||
                      `${record.member.firstName || ''} ${record.member.lastName || ''}`;
                    return (
                      <tr key={record.attendanceId} className="hover:bg-slate-50/70">
                        <td className="px-4 py-4 font-semibold text-slate-800">{name}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{record.member.memberId}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{formatTime(record.checkInTime)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-[#F4510B]">{formatDuration(record.currentDurationMinutes)}</td>
                        <td className="px-4 py-4 text-sm text-slate-600">{record.checkInMethod}</td>
                        <td className="px-4 py-4"><StatusBadge status="inside" /></td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[850px] text-left">
              <thead className="bg-slate-50">
                <tr>
                  <Th>Date</Th>
                  <Th>Check-in</Th>
                  <Th>Check-out</Th>
                  <Th>Duration</Th>
                  <Th>Method</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <LoadingRow columns={7} />
                ) : !historyMember ? (
                  <EmptyRow columns={7} message="Select a member to view attendance history." />
                ) : history.length === 0 ? (
                  <EmptyRow columns={7} message="No attendance history found." />
                ) : (
                  history.map((session) => (
                    <tr key={session._id} className="hover:bg-slate-50/70">
                      <td className="px-4 py-4 text-sm text-slate-600">
                        {session.checkInTime
                          ? new Date(session.checkInTime).toLocaleDateString('en-IN')
                          : '—'}
                      </td>
                      <td className="px-4 py-4 text-sm">{formatTime(session.checkInTime)}</td>
                      <td className="px-4 py-4 text-sm">{formatTime(session.checkOutTime)}</td>
                      <td className="px-4 py-4 text-sm">{formatDuration(session.durationMinutes || 0)}</td>
                      <td className="px-4 py-4 text-sm">{session.checkInMethod}</td>
                      <td className="px-4 py-4"><StatusBadge status={session.attendanceStatus} /></td>
                      <td className="px-4 py-4">
                        <SessionActions
                          session={session}
                          onEdit={openEdit}
                          onVoid={setVoidSession}
                          onAudit={openAudit}
                        />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {!loading && totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-slate-100 px-4 py-4">
            <p className="text-xs text-slate-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((value) => value - 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronLeft size={17} />
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((value) => value + 1)}
                className="rounded-lg border border-slate-200 p-2 disabled:opacity-40"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
        )}
      </div>

     
{manualOpen && (
  <Modal
    title="Add Manual Attendance"
    onClose={() => setManualOpen(false)}
  >
    <form onSubmit={submitManual} className="space-y-5">

      <div className="rounded-xl border border-orange-100 bg-orange-50/60 p-4">
        <p className="text-sm font-semibold text-[#14243B]">
          Manual Attendance Entry
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-600">
          Use this form to record a member's missed attendance
          for a previous date. A reason is required for audit purposes.
        </p>
      </div>

      <Field label="Select Member">
        <select
          required
          value={form.memberId}
          onChange={(event) =>
            setForm({ ...form, memberId: event.target.value })
          }
          className="field"
        >
          <option value="">Choose a member</option>
          {members.map((member) => (
            <option key={member._id} value={member._id}>
              {member.firstName} {member.lastName} — {member.memberId}
            </option>
          ))}
        </select>
      </Field>

      <Field label="Attendance Date">
        <input
          type="date"
          required
          max={new Date(Date.now() - 86400000).toISOString().slice(0, 10)}
          value={form.attendanceDateKey}
          onChange={(event) =>
            setForm({ ...form, attendanceDateKey: event.target.value })
          }
          className="field"
        />
      </Field>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Field label="Check-in Time">
          <input
            type="datetime-local"
            required
            value={form.checkInTime}
            onChange={(event) =>
              setForm({ ...form, checkInTime: event.target.value })
            }
            className="field"
          />
        </Field>

        <Field label="Check-out Time">
          <input
            type="datetime-local"
            required
            value={form.checkOutTime}
            onChange={(event) =>
              setForm({ ...form, checkOutTime: event.target.value })
            }
            className="field"
          />
        </Field>
      </div>

      <Field label="Reason for Manual Attendance">
        <textarea
          required
          minLength={5}
          rows={4}
          value={form.reason}
          onChange={(event) =>
            setForm({ ...form, reason: event.target.value })
          }
          className="field min-h-[110px] resize-y"
          placeholder="Explain why this attendance is being added..."
        />
      </Field>

      <div className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => setManualOpen(false)}
          className="rounded-xl border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Plus size={17} />
          {saving ? 'Creating...' : 'Create Attendance'}
        </button>
      </div>
    </form>
  </Modal>
)}


      {editSession && (
        <Modal title="Correct Attendance" onClose={() => setEditSession(null)}>
          <form onSubmit={submitEdit} className="space-y-4">
            <Field label="Check-in Time">
              <input
                type="datetime-local"
                required
                value={editForm.checkInTime}
                onChange={(event) => setEditForm({ ...editForm, checkInTime: event.target.value })}
                className="field"
              />
            </Field>
            <Field label="Check-out Time">
              <input
                type="datetime-local"
                value={editForm.checkOutTime}
                onChange={(event) => setEditForm({ ...editForm, checkOutTime: event.target.value })}
                className="field"
              />
            </Field>
            <Field label="Correction Reason">
              <textarea
                required
                minLength={5}
                value={editForm.reason}
                onChange={(event) => setEditForm({ ...editForm, reason: event.target.value })}
                className="field min-h-20"
                placeholder="Reason for correction..."
              />
            </Field>
            <ModalActions onCancel={() => setEditSession(null)} saving={saving} label="Save Changes" />
          </form>
        </Modal>
      )}

      {voidSession && (
        <Modal title="Void Attendance" onClose={() => setVoidSession(null)}>
          <form onSubmit={submitVoid} className="space-y-4">
            <div className="rounded-xl border border-red-100 bg-red-50 p-3 text-sm text-red-700">
              This session will be marked as void. It will remain in the audit history and will not count in attendance summaries.
            </div>
            <Field label="Void Reason">
              <textarea
                required
                minLength={5}
                value={voidReason}
                onChange={(event) => setVoidReason(event.target.value)}
                className="field min-h-20"
                placeholder="Why should this attendance be voided?"
              />
            </Field>
            <ModalActions onCancel={() => setVoidSession(null)} saving={saving} label="Confirm Void" />
          </form>
        </Modal>
      )}

      {auditSession && (
        <Modal title="Attendance Audit History" onClose={() => setAuditSession(null)} wide>
          {auditLoading ? (
            <div className="py-10 text-center text-sm text-slate-500">Loading audit history...</div>
          ) : auditLogs.length === 0 ? (
            <div className="py-10 text-center text-sm text-slate-500">No audit history found.</div>
          ) : (
            <div className="max-h-[65vh] space-y-3 overflow-y-auto">
              {auditLogs.map((log, index) => (
                <div key={log._id || index} className="rounded-xl border border-slate-200 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-[#14243B]">{log.action}</span>
                    <span className="text-xs text-slate-500">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('en-IN') : '—'}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">
                    Reason: {log.reason || '—'}
                  </p>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Snapshot title="Before" value={log.before} />
                    <Snapshot title="After" value={log.after} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
};

const SummaryCard = ({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) => (
  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-slate-500">{title}</p>
      <div className="rounded-xl bg-orange-50 p-2.5 text-[#F4510B]">{icon}</div>
    </div>
    <p className="mt-4 text-2xl font-bold text-[#14243B]">{value}</p>
  </div>
);

const Th = ({ children }: { children: React.ReactNode }) => (
  <th className="px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
    {children}
  </th>
);

const LoadingRow = ({ columns }: { columns: number }) => (
  <tr>
    <td colSpan={columns} className="py-14 text-center text-sm text-slate-500">
      <RefreshCw size={22} className="mx-auto mb-2 animate-spin text-[#F4510B]" />
      Loading attendance...
    </td>
  </tr>
);

const EmptyRow = ({
  columns,
  message,
}: {
  columns: number;
  message: string;
}) => (
  <tr>
    <td colSpan={columns} className="py-14 text-center text-sm text-slate-500">
      <ClipboardList size={28} className="mx-auto mb-2 text-slate-300" />
      {message}
    </td>
  </tr>
);

const StatusBadge = ({ status }: { status: string }) => {
  const normalized = status.toLowerCase();
  const isPresent = ['present', 'checked_out'].includes(normalized);
  const isInside = normalized === 'inside' || normalized === 'checked_in';
  const isVoided = normalized === 'voided';

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
      isVoided
        ? 'bg-red-50 text-red-700'
        : isInside
          ? 'bg-blue-50 text-blue-700'
          : isPresent
            ? 'bg-green-50 text-green-700'
            : 'bg-slate-100 text-slate-600'
    }`}>
      {status.toUpperCase()}
    </span>
  );
};

const SessionActions = ({
  session,
  onEdit,
  onVoid,
  onAudit,
}: {
  session: AttendanceSession;
  onEdit: (session: AttendanceSession) => void;
  onVoid: (session: AttendanceSession) => void;
  onAudit: (session: AttendanceSession) => void;
}) => {
  if (session.attendanceStatus === 'VOIDED') {
    return (
      <button
        onClick={() => onAudit(session)}
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
        title="View audit history"
      >
        <History size={16} />
      </button>
    );
  }

  return (
    <div className="flex gap-1">
      <button
        onClick={() => onEdit(session)}
        title="Correct attendance"
        className="rounded-lg p-2 text-slate-500 hover:bg-orange-50 hover:text-[#F4510B]"
      >
        <Pencil size={16} />
      </button>
      <button
        onClick={() => onVoid(session)}
        title="Void attendance"
        className="rounded-lg p-2 text-slate-500 hover:bg-red-50 hover:text-red-600"
      >
        <Ban size={16} />
      </button>
      <button
        onClick={() => onAudit(session)}
        title="Audit history"
        className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
      >
        <Eye size={16} />
      </button>
    </div>
  );
};


const Modal = ({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  wide?: boolean;
}) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/55 p-4 backdrop-blur-[3px]">
    <div
      className={`my-auto w-full ${
        wide ? 'max-w-3xl' : 'max-w-2xl'
      } overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl`}
    >
      <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
        <div>
          <h3 className="text-lg font-bold text-[#14243B]">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">
            Enter the attendance details carefully.
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          aria-label="Close modal"
          className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
        >
          <X size={20} />
        </button>
      </div>

      <div className="max-h-[calc(100vh-130px)] overflow-y-auto p-6">
        {children}
      </div>
    </div>
  </div>
);


const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <div className="flex min-w-0 flex-col gap-2">
    <span className="text-sm font-semibold text-[#14243B]">
      {label}
      <span className="ml-1 text-[#F4510B]">*</span>
    </span>

    <div className="w-full [&>*]:w-full">
      {children}
    </div>
  </div>
);

const ModalActions = ({
  onCancel,
  saving,
  label,
}: {
  onCancel: () => void;
  saving: boolean;
  label: string;
}) => (
  <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
    <button
      type="button"
      onClick={onCancel}
      className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600"
    >
      Cancel
    </button>
    <button
      type="submit"
      disabled={saving}
      className="rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
    >
      {saving ? 'Saving...' : label}
    </button>
  </div>
);

const Snapshot = ({
  title,
  value,
}: {
  title: string;
  value: any;
}) => (
  <div className="rounded-lg bg-slate-50 p-3">
    <p className="mb-2 text-xs font-bold uppercase text-slate-500">{title}</p>
    {value ? (
      <div className="space-y-1 text-xs text-slate-600">
        <p>Check-in: {value.checkInTime ? new Date(value.checkInTime).toLocaleString('en-IN') : '—'}</p>
        <p>Check-out: {value.checkOutTime ? new Date(value.checkOutTime).toLocaleString('en-IN') : '—'}</p>
        <p>Status: {value.attendanceStatus || '—'}</p>
        <p>Duration: {formatDuration(value.durationMinutes || 0)}</p>
      </div>
    ) : (
      <p className="text-xs text-slate-400">No previous snapshot</p>
    )}
  </div>
);

export default AttendancePage;
