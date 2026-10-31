
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';

import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  ShieldCheck,
  Building2,
  UserCheck,
  UserX,
  X,
  RefreshCw,
  Eye,
  EyeOff,
  SlidersHorizontal,
  Mail,
  Phone,
  ChevronDown,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

import {
  createUserApi,
  deleteUserApi,
  getUsersApi,
  updateUserApi,
  updateUserStatusApi,
  type ManagedUser,
  type UserRole,
  type CreateUserPayload,
  type UpdateUserPayload,
} from '../api/user.api';
import { getBranchesApi, type Branch } from '../api/branch.api';

const roles: { value: UserRole; label: string }[] = [
  { value: 'SUPER_ADMIN', label: 'Super Admin' },
  { value: 'BRANCH_ADMIN', label: 'Branch Admin' },
  { value: 'RECEPTION', label: 'Reception' },
  { value: 'TRAINER', label: 'Trainer' },
  { value: 'MEMBER', label: 'Member' },
];

type UserForm = {
  name: string;
  email: string;
  password: string;
  mobile: string;
  role: UserRole;
  branchId: string;
};

const emptyForm: UserForm = {
  name: '',
  email: '',
  password: '',
  mobile: '',
  role: 'BRANCH_ADMIN',
  branchId: '',
};

function getErrorMessage(error: unknown): string {
  const apiError = error as {
    response?: { data?: { message?: string } };
    message?: string;
  };

  return (
    apiError.response?.data?.message ||
    apiError.message ||
    'Something went wrong. Please try again.'
  );
}

function roleLabel(role: UserRole): string {
  return roles.find((item) => item.value === role)?.label || role;
}

function getBranchId(branchId: ManagedUser['branchId']): string {
  if (!branchId) return '—';
  if (typeof branchId === 'string') return branchId;
  return String(branchId);
}

export default function Users() {
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [branchesLoading, setBranchesLoading] = useState(true);
  const [branchesError, setBranchesError] = useState('');
  const [saving, setSaving] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);
  const [form, setForm] = useState<UserForm>(emptyForm);
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const needsBranch = form.role !== 'SUPER_ADMIN';

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError('');

    try {
      const data = await getUsersApi();
      setUsers(data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadBranches = useCallback(async () => {
    setBranchesLoading(true);
    setBranchesError('');

    try {
      const data = await getBranchesApi();
      setBranches(data);
    } catch (err) {
      setBranchesError(getErrorMessage(err));
    } finally {
      setBranchesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadUsers();
    void loadBranches();
  }, [loadUsers, loadBranches]);

  const activeBranches = useMemo(
    () => branches.filter((branch) => branch.isActive),
    [branches],
  );

  const currentBranchExists = branches.some(
    (branch) => branch._id === form.branchId,
  );

  const getBranchDisplay = (branchId: ManagedUser['branchId']) => {
    const id = getBranchId(branchId);
    if (id === '—') return id;
    const branch = branches.find((item) => item._id === id);
    return branch ? `${branch.name} (${branch.code})` : id;
  };

  const filteredUsers = useMemo(() => {
    const term = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !term ||
        user.name.toLowerCase().includes(term) ||
        user.email.toLowerCase().includes(term) ||
        user.mobile.toLowerCase().includes(term) ||
        getBranchDisplay(user.branchId).toLowerCase().includes(term);

      const matchesRole =
        roleFilter === 'ALL' || user.role === roleFilter;

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE' && user.isActive) ||
        (statusFilter === 'INACTIVE' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, branches, search, roleFilter, statusFilter]);

  const activeCount = users.filter((user) => user.isActive).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter(
    (user) =>
      user.role === 'SUPER_ADMIN' || user.role === 'BRANCH_ADMIN',
  ).length;

  const openCreateModal = () => {
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
    setNotice('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const openEditModal = (user: ManagedUser) => {
    setEditingUser(user);
    setForm({
      name: user.name || '',
      email: user.email || '',
      password: '',
      mobile: user.mobile || '',
      role: user.role,
      branchId:
        getBranchId(user.branchId) === '—'
          ? ''
          : getBranchId(user.branchId),
    });

    setError('');
    setNotice('');
    setShowPassword(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingUser(null);
    setForm(emptyForm);
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setNotice('');

    if (!form.name.trim() || !form.email.trim() || !form.mobile.trim()) {
      setError('Please complete all required fields.');
      return;
    }

    if (needsBranch && !form.branchId.trim()) {
      setError('Branch ID is required for this role.');
      return;
    }

    if (!editingUser && form.password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setSaving(true);

    try {
      if (editingUser) {
        const payload: UpdateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          mobile: form.mobile.trim(),
          role: form.role,
          branchId: needsBranch ? form.branchId.trim() : null,
        };

        const updated = await updateUserApi(editingUser._id, payload);

        setUsers((current) =>
          current.map((user) =>
            user._id === updated._id ? updated : user,
          ),
        );

        setNotice('User updated successfully.');
      } else {
        const payload: CreateUserPayload = {
          name: form.name.trim(),
          email: form.email.trim(),
          password: form.password,
          mobile: form.mobile.trim(),
          role: form.role,
          ...(needsBranch ? { branchId: form.branchId.trim() } : {}),
        };

        const created = await createUserApi(payload);

        setUsers((current) => [created, ...current]);
        setNotice('User created successfully.');
      }

      setModalOpen(false);
      setEditingUser(null);
      setForm(emptyForm);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (user: ManagedUser) => {
    const nextStatus = !user.isActive;

    const confirmed = window.confirm(
      `${nextStatus ? 'Activate' : 'Deactivate'} ${user.name}?`,
    );

    if (!confirmed) return;

    setActionUserId(user._id);
    setError('');
    setNotice('');

    try {
      const updated = await updateUserStatusApi(user._id, nextStatus);

      setUsers((current) =>
        current.map((item) =>
          item._id === updated._id ? updated : item,
        ),
      );

      setNotice(
        `${updated.name} has been ${nextStatus ? 'activated' : 'deactivated'}.`,
      );
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionUserId(null);
    }
  };

  const handleDelete = async (user: ManagedUser) => {
    const confirmed = window.confirm(
      `Delete ${user.name} (${user.email}) permanently?\n\nThis action cannot be undone.`,
    );

    if (!confirmed) return;

    setActionUserId(user._id);
    setError('');
    setNotice('');

    try {
      await deleteUserApi(user._id);

      setUsers((current) =>
        current.filter((item) => item._id !== user._id),
      );

      setNotice('User deleted successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setActionUserId(null);
    }
  };

  const updateField = <K extends keyof UserForm>(
    field: K,
    value: UserForm[K],
  ) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const clearFilters = () => {
    setSearch('');
    setRoleFilter('ALL');
    setStatusFilter('ALL');
  };

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>Management</span>
            <span>/</span>
            <span className="font-medium 	text-[#F4510B]">Users</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            User Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage accounts, assign roles and control platform access.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => void loadUsers()}
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={loading ? 'animate-spin' : ''}
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={openCreateModal}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-[#D94308]"
          >
            <Plus size={18} />
            Add User
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && !modalOpen && (
        <AlertMessage
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {notice && (
        <AlertMessage
          type="success"
          message={notice}
          onClose={() => setNotice('')}
        />
      )}

      {/* Statistics */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total Users"
          value={users.length}
          detail="All registered accounts"
          icon={<UsersIcon size={21} />}
          iconClass="bg-orange-50 	text-[#F4510B]"
        />

        <StatCard
          label="Active Users"
          value={activeCount}
          detail="Accounts with active access"
          icon={<UserCheck size={21} />}
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          label="Inactive Users"
          value={inactiveCount}
          detail="Accounts with access disabled"
          icon={<UserX size={21} />}
          iconClass="bg-amber-50 text-amber-700"
        />

        <StatCard
          label="Administrators"
          value={adminCount}
          detail="Super Admin and Branch Admin"
          icon={<ShieldCheck size={21} />}
          iconClass="bg-violet-50 text-violet-700"
        />
      </section>

      {/* Users table */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 lg:flex-row lg:items-center lg:justify-between sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              All Users
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              Showing {filteredUsers.length} of {users.length} users
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="relative">
              <Search
                size={17}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search users..."
                aria-label="Search users"
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white"
              />
            </div>

            <div className="relative">
              <SlidersHorizontal
                size={15}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <select
                value={roleFilter}
                onChange={(event) => setRoleFilter(event.target.value)}
                aria-label="Filter by role"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-8 text-sm text-slate-600 outline-none focus:border-[#F4510B]"
              >
                <option value="ALL">All roles</option>
                {roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>

            <div className="relative">
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                aria-label="Filter by status"
                className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 pr-8 text-sm text-slate-600 outline-none focus:border-[#F4510B]"
              >
                <option value="ALL">All statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
              <ChevronDown
                size={15}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3 text-slate-400">
            <RefreshCw size={26} className="animate-spin text-[#F4510B]" />
            <p className="text-sm">Loading users...</p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-6 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <UsersIcon size={29} />
            </div>

            <h3 className="font-semibold text-slate-800">
              No users found
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-slate-500">
              Try changing your search or filters, or create a new user.
            </p>

            {search || roleFilter !== 'ALL' || statusFilter !== 'ALL' ? (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-4 text-sm font-semibold 	text-[#F4510B] hover:text-blue-800"
              >
                Clear filters
              </button>
            ) : (
              <button
                type="button"
                onClick={openCreateModal}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#D94308]"
              >
                <Plus size={16} />
                Add First User
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[850px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="px-6 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Role</th>
                    <th className="px-5 py-4 font-semibold">Branch</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">
                      Actions
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user._id}
                      className="transition-colors hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-4">
                        <UserIdentity user={user} />
                      </td>

                      <td className="px-5 py-4">
                        <RoleBadge role={user.role} />
                      </td>

                      <td className="px-5 py-4">
                        {user.role === 'SUPER_ADMIN' ? (
                          <span className="text-xs text-slate-400">
                            Not required
                          </span>
                        ) : (
                          <span
                            className="inline-flex max-w-48 items-center gap-2 truncate text-xs text-slate-600"
                            title={getBranchDisplay(user.branchId)}
                          >
                            <Building2
                              size={15}
                              className="shrink-0 text-slate-400"
                            />
                            {getBranchDisplay(user.branchId)}
                          </span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <StatusBadge isActive={user.isActive} />
                      </td>

                      <td className="px-6 py-4">
                        <UserActions
                          user={user}
                          busy={actionUserId === user._id}
                          onEdit={() => openEditModal(user)}
                          onStatus={() => void handleStatusChange(user)}
                          onDelete={() => void handleDelete(user)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {filteredUsers.map((user) => (
                <div
                  key={user._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity user={user} />
                    <StatusBadge isActive={user.isActive} />
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                    <RoleBadge role={user.role} />
                    {user.role !== 'SUPER_ADMIN' && (
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs text-slate-600">
                        <Building2 size={13} />
                        {getBranchDisplay(user.branchId)}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 border-t border-slate-100 pt-3">
                    <UserActions
                      user={user}
                      busy={actionUserId === user._id}
                      onEdit={() => openEditModal(user)}
                      onStatus={() => void handleStatusChange(user)}
                      onDelete={() => void handleDelete(user)}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        <div className="border-t border-slate-100 px-5 py-4 text-xs text-slate-500 sm:px-6">
          Showing {filteredUsers.length} of {users.length} users
        </div>
      </section>

      <p className="px-1 text-xs leading-5 text-slate-400">
        Deactivating an account revokes its active sessions. User deletion is
        permanent. Changes to a user's role or branch may require them to log
        in again.
      </p>

      {/* Create / Edit modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-slate-950/50 p-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="user-modal-title"
            className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <div className="flex items-start justify-between border-b border-slate-100 p-5 sm:p-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider 	text-[#F4510B]">
                  User Accounts
                </p>

                <h2
                  id="user-modal-title"
                  className="mt-2 text-xl font-bold text-slate-800"
                >
                  {editingUser ? 'Edit User' : 'Create New User'}
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {editingUser
                    ? 'Update account details and access role.'
                    : 'Add a user to your gym management platform.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 sm:p-6">
                {error && (
                  <div className="sm:col-span-2">
                    <AlertMessage
                      type="error"
                      message={error}
                      onClose={() => setError('')}
                    />
                  </div>
                )}

                <FormField label="Full Name" required>
                  <input
                    required
                    value={form.name}
                    onChange={(event) =>
                      updateField('name', event.target.value)
                    }
                    placeholder="Enter full name"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Email Address" required>
                  <input
                    required
                    type="email"
                    value={form.email}
                    onChange={(event) =>
                      updateField('email', event.target.value)
                    }
                    placeholder="name@example.com"
                    className="form-input"
                  />
                </FormField>

                <FormField label="Mobile Number" required>
                  <input
                    required
                    type="tel"
                    value={form.mobile}
                    onChange={(event) =>
                      updateField('mobile', event.target.value)
                    }
                    placeholder="Enter mobile number"
                    className="form-input"
                  />
                </FormField>

                <FormField label="User Role" required>
                  <select
                    required
                    value={form.role}
                    onChange={(event) =>
                      updateField('role', event.target.value as UserRole)
                    }
                    className="form-input"
                  >
                    {roles.map((role) => (
                      <option key={role.value} value={role.value}>
                        {role.label}
                      </option>
                    ))}
                  </select>
                </FormField>

                {needsBranch && (
                  <div className="sm:col-span-2">
                    <FormField label="Assign Branch" required>
                      <div className="relative">
                        <Building2
                          size={17}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                        <select
                          required
                          value={form.branchId}
                          disabled={branchesLoading || saving}
                          onChange={(event) =>
                            updateField('branchId', event.target.value)
                          }
                          className="form-input appearance-none pl-10 pr-10 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          <option value="">
                            {branchesLoading
                              ? 'Loading branches...'
                              : 'Select a branch'}
                          </option>

                          {activeBranches.map((branch) => (
                            <option key={branch._id} value={branch._id}>
                              {branch.name} ({branch.code})
                            </option>
                          ))}

                          {editingUser &&
                            form.branchId &&
                            !currentBranchExists && (
                              <option value={form.branchId}>
                                Current assigned branch ({form.branchId})
                              </option>
                            )}

                          {editingUser &&
                            form.branchId &&
                            currentBranchExists &&
                            !branches.find(
                              (branch) => branch._id === form.branchId
                                && branch.isActive,
                            ) && (
                              <option value={form.branchId}>
                                {branches.find(
                                  (branch) => branch._id === form.branchId,
                                )?.name || 'Current branch'} (Inactive)
                              </option>
                            )}
                        </select>
                        <ChevronDown
                          size={16}
                          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />
                      </div>

                      {branchesError ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2.5">
                          <p className="text-xs leading-5 text-red-700">
                            Unable to load branches: {branchesError}
                          </p>
                          <button
                            type="button"
                            onClick={() => void loadBranches()}
                            className="text-xs font-semibold text-red-700 underline"
                          >
                            Retry
                          </button>
                        </div>
                      ) : (
                        <p className="mt-2 text-xs leading-5 text-slate-400">
                          Select an active branch. The branch database ID will
                          be submitted automatically.
                        </p>
                      )}

                      {!branchesLoading &&
                        !branchesError &&
                        activeBranches.length === 0 && (
                          <p className="mt-2 text-xs text-amber-700">
                            No active branches are available. Create or activate
                            a branch before assigning this user.
                          </p>
                        )}
                    </FormField>
                  </div>
                )}

                {!editingUser && (
                  <div className="sm:col-span-2">
                    <FormField label="Temporary Password" required>
                      <div className="relative">
                        <input
                          required
                          type={showPassword ? 'text' : 'password'}
                          minLength={8}
                          autoComplete="new-password"
                          value={form.password}
                          onChange={(event) =>
                            updateField('password', event.target.value)
                          }
                          placeholder="Minimum 8 characters"
                          className="form-input pr-12"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword((value) => !value)
                          }
                          aria-label={
                            showPassword ? 'Hide password' : 'Show password'
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 transition hover:text-slate-700"
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>

                      <p className="mt-2 text-xs text-slate-400">
                        The password is used only when creating the account.
                      </p>
                    </FormField>
                  </div>
                )}
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 p-5 sm:flex-row sm:justify-end sm:p-6">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#D94308] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving && (
                    <RefreshCw size={16} className="animate-spin" />
                  )}

                  {saving
                    ? 'Saving...'
                    : editingUser
                      ? 'Save Changes'
                      : 'Create User'}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}

      <style>{`
        .form-input {
          width: 100%;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          background: #f8fafc;
          padding: 11px 13px;
          font-size: 13px;
          color: #334155;
          outline: none;
          transition: all 150ms ease;
        }
        .form-input::placeholder {
          color: #94a3b8;
        }
        .form-input:focus {
          border-color: #60a5fa;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.10);
        }
      `}</style>
    </div>
  );
}

function UserIdentity({ user }: { user: ManagedUser }) {
  const initials = user.name
    ?.split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('') || 'U';

  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 font-semibold 	text-[#F4510B]">
        {initials}
      </div>

      <div className="min-w-0">
        <p className="max-w-xs truncate font-semibold text-slate-800">
          {user.name}
        </p>

        <p className="mt-1 flex max-w-xs items-center gap-1.5 truncate text-xs text-slate-500">
          <Mail size={12} className="shrink-0" />
          {user.email}
        </p>

        <p className="mt-1 flex items-center gap-1.5 text-xs text-slate-500">
          <Phone size={12} />
          {user.mobile}
        </p>
      </div>
    </div>
  );
}

function UserActions({
  user,
  busy,
  onEdit,
  onStatus,
  onDelete,
}: {
  user: ManagedUser;
  busy: boolean;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex items-center justify-end gap-2">
      <button
        type="button"
        onClick={onEdit}
        disabled={busy}
        title="Edit user"
        aria-label={`Edit ${user.name}`}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:	text-[#F4510B] disabled:opacity-50"
      >
        <Pencil size={16} />
      </button>

      <button
        type="button"
        onClick={onStatus}
        disabled={busy}
        title={user.isActive ? 'Deactivate user' : 'Activate user'}
        aria-label={`${user.isActive ? 'Deactivate' : 'Activate'} ${user.name}`}
        className={`rounded-lg border p-2 transition disabled:opacity-50 ${
          user.isActive
            ? 'border-slate-200 text-slate-500 hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        {user.isActive ? <UserX size={16} /> : <UserCheck size={16} />}
      </button>

      <button
        type="button"
        onClick={onDelete}
        disabled={busy}
        title="Delete user"
        aria-label={`Delete ${user.name}`}
        className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
      >
        {busy ? (
          <RefreshCw size={16} className="animate-spin" />
        ) : (
          <Trash2 size={16} />
        )}
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-lg border border-orange-100 bg-orange-50 px-2.5 py-1.5 text-xs font-medium 	text-[#F4510B]">
      <ShieldCheck size={14} />
      {roleLabel(role)}
    </span>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ${
        isActive
          ? 'bg-emerald-50 text-emerald-700'
          : 'bg-slate-100 text-slate-500'
      }`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          isActive ? 'bg-emerald-500' : 'bg-slate-400'
        }`}
      />
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

function FormField({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block min-w-0">
      <span className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
  );
}

function StatCard({
  label,
  value,
  detail,
  icon,
  iconClass,
}: {
  label: string;
  value: number;
  detail: string;
  icon: ReactNode;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{detail}</p>
        </div>

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function AlertMessage({
  type,
  message,
  onClose,
}: {
  type: 'error' | 'success';
  message: string;
  onClose: () => void;
}) {
  const isError = type === 'error';

  return (
    <div
      role="alert"
      className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
        isError
          ? 'border-red-200 bg-red-50 text-red-700'
          : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      }`}
    >
      {isError ? (
        <AlertCircle size={19} className="mt-0.5 shrink-0" />
      ) : (
        <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
      )}

      <p className="flex-1">{message}</p>

      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss message"
      >
        <X size={17} />
      </button>
    </div>
  );
}
