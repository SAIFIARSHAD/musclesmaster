
import { useEffect, useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import {
  Search,
  Plus,
  Users,
  Dumbbell,
  Headset,
  Pencil,
  Trash2,
  UserCheck,
  UserX,
  X,
  Loader2,
  RefreshCw,
  Mail,
  Phone,
  ShieldCheck,
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import {
  getUsersApi,
  createStaffApi,
  updateStaffApi,
  updateStaffStatusApi,
  deleteStaffApi,
} from '../api/user.api';

import type {
  StaffUser,
  CreateStaffRequest,
} from '../types/user.types';

type StaffFilter = 'ALL' | 'TRAINER' | 'RECEPTION';

interface StaffFormState {
  name: string;
  email: string;
  mobile: string;
  password: string;
  role: 'TRAINER' | 'RECEPTION';
}

const initialForm: StaffFormState = {
  name: '',
  email: '',
  mobile: '',
  password: '',
  role: 'RECEPTION',
};

const getErrorMessage = (error: unknown): string => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'response' in error
  ) {
    const response = (error as {
      response?: { data?: { message?: string } };
    }).response;

    if (response?.data?.message) {
      return response.data.message;
    }
  }

  if (error instanceof Error) return error.message;

  return 'Something went wrong. Please try again.';
};

const formatDate = (date?: string) => {
  if (!date) return '—';

  const parsed = new Date(date);

  if (Number.isNaN(parsed.getTime())) return '—';

  return parsed.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  iconClass,
}: {
  title: string;
  value: number;
  description: string;
  icon: typeof Users;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h3 className="mt-2 text-3xl font-extrabold tracking-tight text-[#14243B]">
            {value}
          </h3>
          <p className="mt-1 text-xs text-slate-400">{description}</p>
        </div>

        <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${iconClass}`}>
          <Icon size={22} />
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          active ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

export default function StaffManagementPage() {
  const { user } = useAuth();

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<StaffFilter>('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [form, setForm] = useState<StaffFormState>(initialForm);

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const branchId = user?.branchId;

  const fetchStaff = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await getUsersApi();

      if (!response.success || !Array.isArray(response.data)) {
        throw new Error(response.message || 'Unable to fetch staff');
      }

      // Members are managed separately in the Members module.
      const branchStaff = response.data.filter(
        (item) =>
          (item.role === 'TRAINER' || item.role === 'RECEPTION') &&
          (!branchId || String(item.branchId) === String(branchId)),
      );

      setStaff(branchStaff);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaff();
    // fetchStaff is intentionally triggered when the authenticated branch changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [branchId]);

  const trainers = staff.filter((item) => item.role === 'TRAINER');
  const receptionists = staff.filter((item) => item.role === 'RECEPTION');
  const activeStaff = staff.filter((item) => item.isActive);

  const filteredStaff = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return staff.filter((item) => {
      const matchesRole =
        filter === 'ALL' || item.role === filter;

      const matchesSearch =
        !normalizedSearch ||
        item.name.toLowerCase().includes(normalizedSearch) ||
        item.email.toLowerCase().includes(normalizedSearch) ||
        item.mobile.toLowerCase().includes(normalizedSearch);

      return matchesRole && matchesSearch;
    });
  }, [staff, search, filter]);

  const openAddModal = () => {
    setEditingStaff(null);
    setForm(initialForm);
    setError('');
    setModalOpen(true);
  };

  const openEditModal = (item: StaffUser) => {
    setEditingStaff(item);
    setForm({
      name: item.name,
      email: item.email,
      mobile: item.mobile,
      password: '',
      role: item.role as 'TRAINER' | 'RECEPTION',
    });
    setError('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingStaff(null);
    setForm(initialForm);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim()) {
      setError('Please fill in all required fields.');
      return;
    }

    if (!editingStaff && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

const assignedBranchId = user?.branchId;

if (!editingStaff && !assignedBranchId) {
  setError(
    'Your account does not have a branch assigned. Please contact Super Admin.'
  );
  return;
}

    setSaving(true);

    try {
      if (editingStaff) {
        await updateStaffApi(editingStaff._id, {
          name: form.name.trim(),
          email: form.email.trim().toLowerCase(),
          mobile: form.mobile.trim(),
        });

        setSuccess('Staff details updated successfully.');
      } else {
            const payload: CreateStaffRequest = {
            name: form.name.trim(),
            email: form.email.trim().toLowerCase(),
            mobile: form.mobile.trim(),
            password: form.password,
            role: form.role,
            branchId: assignedBranchId!,
            };

        await createStaffApi(payload);
        setSuccess('Staff member created successfully.');
      }

      setModalOpen(false);
      setEditingStaff(null);
      setForm(initialForm);
      await fetchStaff();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (item: StaffUser) => {
    const nextStatus = !item.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? 'Activate' : 'Deactivate'} ${item.name}'s account?`,
    );

    if (!confirmed) return;

    setActionId(item._id);
    setError('');
    setSuccess('');

    try {
      await updateStaffStatusApi(item._id, nextStatus);
      setStaff((current) =>
        current.map((staffItem) =>
          staffItem._id === item._id
            ? { ...staffItem, isActive: nextStatus }
            : staffItem,
        ),
      );

      setSuccess(
        `${item.name} has been ${nextStatus ? 'activated' : 'deactivated'}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (item: StaffUser) => {
    const confirmed = window.confirm(
      `Are you sure you want to permanently delete ${item.name}'s account? This action cannot be undone.`,
    );

    if (!confirmed) return;

    setActionId(item._id);
    setError('');
    setSuccess('');

    try {
      await deleteStaffApi(item._id);
      setStaff((current) =>
        current.filter((staffItem) => staffItem._id !== item._id),
      );
      setSuccess(`${item.name} has been deleted successfully.`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionId(null);
    }
  };

  const filterOptions: {
    label: string;
    value: StaffFilter;
    count: number;
  }[] = [
    { label: 'All Staff', value: 'ALL', count: staff.length },
    { label: 'Trainers', value: 'TRAINER', count: trainers.length },
    {
      label: 'Receptionists',
      value: 'RECEPTION',
      count: receptionists.length,
    },
  ];

  return (
    <div className="space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.16em] text-[#F4510B]">
            <ShieldCheck size={15} />
            Branch Administration
          </div>

          <h1 className="mt-2 text-2xl font-extrabold tracking-tight text-[#14243B] sm:text-3xl">
            Staff Management
          </h1>

          <p className="mt-1 text-sm text-slate-500">
            Manage trainers and reception staff for your branch.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void fetchStaff()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>

          <button
            type="button"
            onClick={openAddModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-orange-900/15 transition hover:bg-[#dc4508]"
          >
            <Plus size={18} />
            Add Staff
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && !modalOpen && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={() => setError('')} aria-label="Dismiss error">
            <X size={17} />
          </button>
        </div>
      )}

      {success && (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <span>{success}</span>
          <button type="button" onClick={() => setSuccess('')} aria-label="Dismiss message">
            <X size={17} />
          </button>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Total Staff"
          value={staff.length}
          description="All branch staff accounts"
          icon={Users}
          iconClass="bg-orange-50 text-[#F4510B]"
        />

        <SummaryCard
          title="Active Staff"
          value={activeStaff.length}
          description="Currently active accounts"
          icon={UserCheck}
          iconClass="bg-emerald-50 text-emerald-600"
        />

        <SummaryCard
          title="Trainers"
          value={trainers.length}
          description="Training team members"
          icon={Dumbbell}
          iconClass="bg-blue-50 text-blue-600"
        />

        <SummaryCard
          title="Receptionists"
          value={receptionists.length}
          description="Front desk team members"
          icon={Headset}
          iconClass="bg-violet-50 text-violet-600"
        />
      </div>

      {/* Staff Directory */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 p-5 sm:p-6">
          <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
            <div>
              <h2 className="text-lg font-bold text-[#14243B]">
                Staff Directory
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                View and manage your branch team.
              </p>
            </div>

            <div className="relative w-full lg:max-w-sm">
              <Search
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search name, email or mobile..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-[#F4510B] focus:bg-white focus:ring-4 focus:ring-orange-500/10"
              />
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={`rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                  filter === option.value
                    ? 'bg-[#14243B] text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {option.label}
                <span
                  className={`ml-2 rounded-md px-1.5 py-0.5 text-xs ${
                    filter === option.value
                      ? 'bg-white/15 text-white'
                      : 'bg-white text-slate-500'
                  }`}
                >
                  {option.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-500">
            <Loader2 size={20} className="animate-spin text-[#F4510B]" />
            Loading staff members...
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
              <Users size={28} />
            </div>

            <h3 className="mt-4 text-base font-bold text-[#14243B]">
              {search || filter !== 'ALL'
                ? 'No matching staff found'
                : 'No staff members yet'}
            </h3>

            <p className="mt-1 max-w-sm text-sm text-slate-500">
              {search || filter !== 'ALL'
                ? 'Try changing your search or filter.'
                : 'Add your first trainer or receptionist to get started.'}
            </p>

            {!search && filter === 'ALL' && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#dc4508]"
              >
                <Plus size={17} />
                Add First Staff Member
              </button>
            )}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/80">
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Staff Member
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Contact
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Role
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                      Status
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold uppercase tracking-wider text-slate-500">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.map((item) => (
                    <tr
                      key={item._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-extrabold ${
                              item.role === 'TRAINER'
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-violet-50 text-violet-600'
                            }`}
                          >
                            {item.name.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-bold text-[#14243B]">
                              {item.name}
                            </p>
                            <p className="mt-0.5 text-xs text-slate-400">
                              ID: {item._id.slice(-7).toUpperCase()}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="space-y-1.5">
                          <p className="flex items-center gap-2 text-sm text-slate-600">
                            <Mail size={14} className="text-slate-400" />
                            {item.email}
                          </p>
                          <p className="flex items-center gap-2 text-xs text-slate-500">
                            <Phone size={13} className="text-slate-400" />
                            {item.mobile}
                          </p>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex rounded-lg px-3 py-1.5 text-xs font-bold ${
                            item.role === 'TRAINER'
                              ? 'bg-blue-50 text-blue-700'
                              : 'bg-violet-50 text-violet-700'
                          }`}
                        >
                          {item.role === 'TRAINER' ? 'Trainer' : 'Receptionist'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-500">
                        {formatDate(item.createdAt)}
                      </td>

                      <td className="px-6 py-4">
                        <StatusBadge active={item.isActive} />
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Edit staff"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-orange-50 hover:text-[#F4510B]"
                          >
                            <Pencil size={16} />
                          </button>

                          <button
                            type="button"
                            disabled={actionId === item._id}
                            onClick={() => void handleStatusChange(item)}
                            title={item.isActive ? 'Deactivate' : 'Activate'}
                            className={`rounded-lg p-2 transition disabled:opacity-40 ${
                              item.isActive
                                ? 'text-slate-500 hover:bg-amber-50 hover:text-amber-600'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            {actionId === item._id ? (
                              <Loader2 size={16} className="animate-spin" />
                            ) : item.isActive ? (
                              <UserX size={16} />
                            ) : (
                              <UserCheck size={16} />
                            )}
                          </button>

                          <button
                            type="button"
                            disabled={actionId === item._id}
                            onClick={() => void handleDelete(item)}
                            title="Delete staff"
                            className="rounded-lg p-2 text-slate-500 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-40"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="border-t border-slate-100 px-6 py-4">
              <p className="text-xs font-medium text-slate-500">
                Showing {filteredStaff.length} of {staff.length} staff members
              </p>
            </div>
          </>
        )}
      </section>

      {/* Add / Edit Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <div className="my-auto w-full max-w-xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-extrabold text-[#14243B]">
                  {editingStaff ? 'Edit Staff Member' : 'Add New Staff'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {editingStaff
                    ? 'Update staff account information.'
                    : 'Create a trainer or receptionist account.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close modal"
                className="rounded-xl p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="space-y-5 p-6">
                {error && (
                  <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {error}
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(event) =>
                      setForm({ ...form, name: event.target.value })
                    }
                    placeholder="Enter full name"
                    required
                    className="field"
                  />
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={form.email}
                      onChange={(event) =>
                        setForm({ ...form, email: event.target.value })
                      }
                      placeholder="name@example.com"
                      required
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                      Mobile Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={form.mobile}
                      onChange={(event) =>
                        setForm({ ...form, mobile: event.target.value })
                      }
                      placeholder="Enter mobile number"
                      required
                      className="field"
                    />
                  </div>
                </div>

                {!editingStaff && (
                  <>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Temporary Password <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        value={form.password}
                        onChange={(event) =>
                          setForm({ ...form, password: event.target.value })
                        }
                        placeholder="Minimum 8 characters"
                        minLength={8}
                        required
                        autoComplete="new-password"
                        className="field"
                      />
                      <p className="mt-1.5 text-xs text-slate-400">
                        The staff member can use this password to sign in.
                      </p>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-slate-700">
                        Staff Role <span className="text-red-500">*</span>
                      </label>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, role: 'TRAINER' })
                          }
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                            form.role === 'TRAINER'
                              ? 'border-[#F4510B] bg-orange-50 ring-2 ring-orange-500/10'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Dumbbell
                            size={21}
                            className={
                              form.role === 'TRAINER'
                                ? 'text-[#F4510B]'
                                : 'text-slate-400'
                            }
                          />
                          <span>
                            <span className="block text-sm font-bold text-[#14243B]">
                              Trainer
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              Training staff
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            setForm({ ...form, role: 'RECEPTION' })
                          }
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition ${
                            form.role === 'RECEPTION'
                              ? 'border-[#F4510B] bg-orange-50 ring-2 ring-orange-500/10'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Headset
                            size={21}
                            className={
                              form.role === 'RECEPTION'
                                ? 'text-[#F4510B]'
                                : 'text-slate-400'
                            }
                          />
                          <span>
                            <span className="block text-sm font-bold text-[#14243B]">
                              Receptionist
                            </span>
                            <span className="mt-0.5 block text-xs text-slate-500">
                              Front desk staff
                            </span>
                          </span>
                        </button>
                      </div>
                    </div>
                  </>
                )}

                <div className="rounded-xl border border-slate-100 bg-slate-50 px-4 py-3">
                  <p className="text-xs font-semibold text-slate-600">
                    <ShieldCheck size={14} className="mr-1 inline text-emerald-600" />
                    Branch assignment
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-slate-500">
                    This account will be managed under your assigned branch.
                    Branch access is verified by the server.
                  </p>
                </div>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50/70 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-6 py-2.5 text-sm font-bold text-white transition hover:bg-[#dc4508] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && <Loader2 size={16} className="animate-spin" />}
                  {saving
                    ? 'Saving...'
                    : editingStaff
                      ? 'Save Changes'
                      : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
