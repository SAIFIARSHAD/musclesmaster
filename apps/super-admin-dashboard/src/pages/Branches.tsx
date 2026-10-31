
import { useCallback, useEffect, useMemo, useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Plus,
  Search,
  RefreshCw,
  Pencil,
  Power,
  MapPin,
  Phone,
  Mail,
  Hash,
  X,
  CheckCircle2,
  AlertCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  UserRound,
} from 'lucide-react';

import {
  getBranchesPageApi,
  createBranchApi,
  updateBranchApi,
  updateBranchStatusApi,
  type Branch,
  type BranchPayload,
  type BranchPagination,
} from '../api/branch.api';

const PAGE_SIZE = 10;

const emptyForm: BranchPayload = {
  name: '',
  code: '',
  address: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  gstNumber: '',
};

const GST_REGEX =
  /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/;

export default function Branches() {
  const navigate = useNavigate();

  const [branches, setBranches] = useState<Branch[]>([]);
  const [pagination, setPagination] = useState<BranchPagination>({
    page: 1,
    limit: PAGE_SIZE,
    total: 0,
    totalPages: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage] = useState(1);

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [form, setForm] = useState<BranchPayload>(emptyForm);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError('');

      const result = await getBranchesPageApi({
        page,
        limit: PAGE_SIZE,
        search: search.trim(),
        status,
      });

      setBranches(result.data);
      setPagination(result.pagination);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Unable to load branches. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => {
    void loadBranches();
  }, [loadBranches]);

  const stats = useMemo(() => {
    const active = branches.filter((branch) => branch.isActive).length;

    return {
      total: pagination.total,
      active,
      inactive: branches.length - active,
    };
  }, [branches, pagination.total]);

  const openAddModal = () => {
    setEditingBranch(null);
    setForm({ ...emptyForm });
    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const openEditModal = (branch: Branch) => {
    setEditingBranch(branch);

    setForm({
      name: branch.name || '',
      code: branch.code || '',
      address: branch.address || '',
      city: branch.city || '',
      state: branch.state || '',
      phone: branch.phone || '',
      email: branch.email || '',
      gstNumber: branch.gstNumber || '',
    });

    setError('');
    setSuccess('');
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;

    setModalOpen(false);
    setEditingBranch(null);
    setForm({ ...emptyForm });
    setError('');
  };

  const updateField = (field: keyof BranchPayload, value: string) => {
    setForm((previous) => ({
      ...previous,
      [field]:
        field === 'code' || field === 'gstNumber'
          ? value.toUpperCase()
          : value,
    }));
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleStatusChange = (value: 'all' | 'active' | 'inactive') => {
    setStatus(value);
    setPage(1);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const gstNumber = form.gstNumber?.trim().toUpperCase() || '';

    if (gstNumber && !GST_REGEX.test(gstNumber)) {
      setError('Please enter a valid 15-character GST number.');
      return;
    }

    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const payload: BranchPayload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        address: form.address?.trim() || '',
        city: form.city?.trim() || '',
        state: form.state?.trim() || '',
        phone: form.phone?.trim() || '',
        email: form.email?.trim() || '',
        gstNumber,
      };

      if (editingBranch) {
        await updateBranchApi(editingBranch._id, payload);
        setSuccess('Branch details updated successfully.');
      } else {
        await createBranchApi(payload);
        setSuccess('New branch created successfully.');
        setPage(1);
      }

      setModalOpen(false);
      setEditingBranch(null);
      setForm({ ...emptyForm });

      // Refresh the list after saving.
      if (page === 1) {
        await loadBranches();
      } else if (!editingBranch) {
        // The page state change will trigger the fetch.
      } else {
        await loadBranches();
      }
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          'Something went wrong. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (branch: Branch) => {
    const action = branch.isActive ? 'deactivate' : 'activate';

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${branch.name}?`,
    );

    if (!confirmed) return;

    try {
      setError('');
      setSuccess('');

      await updateBranchStatusApi(branch._id, !branch.isActive);

      setSuccess(
        `${branch.name} has been ${
          branch.isActive ? 'deactivated' : 'activated'
        } successfully.`,
      );

      await loadBranches();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          `Unable to ${action} this branch.`,
      );
    }
  };

  const goToSettings = (branch: Branch) => {
    navigate(`/branches/${branch._id}/settings`);
  };

  const startRecord = pagination.total === 0
    ? 0
    : (pagination.page - 1) * pagination.limit + 1;

  const endRecord = Math.min(
    pagination.page * pagination.limit,
    pagination.total,
  );

  return (
    <div className="space-y-7">
      {/* Page heading */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <div className="mb-2 flex items-center gap-2 text-sm text-slate-400">
            <span>Management</span>
            <span>/</span>
            <span className="font-semibold text-[#F4510B]">Branches</span>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-800 sm:text-3xl">
            Branch Management
          </h1>

          <p className="mt-2 text-sm text-slate-500">
            Manage and monitor all your gym branches from one place.
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-3 text-sm font-semibold text-white shadow-sm shadow-orange-900/10 transition hover:bg-[#D94308]"
        >
          <Plus size={18} />
          Add New Branch
        </button>
      </div>

      {/* Alerts */}
      {error && !modalOpen && (
        <AlertMessage
          type="error"
          message={error}
          onClose={() => setError('')}
        />
      )}

      {success && (
        <AlertMessage
          type="success"
          message={success}
          onClose={() => setSuccess('')}
        />
      )}

      {/* Statistics */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard
          title="Total Branches"
          value={stats.total}
          icon={<Building2 size={21} />}
          description="Matching all current filters"
          iconClass="bg-orange-50 text-[#F4510B]"
        />

        <StatCard
          title="Active on This Page"
          value={stats.active}
          icon={<CheckCircle2 size={21} />}
          description="Currently operational"
          iconClass="bg-emerald-50 text-emerald-700"
        />

        <StatCard
          title="Inactive on This Page"
          value={stats.inactive}
          icon={<Power size={21} />}
          description="Currently deactivated"
          iconClass="bg-amber-50 text-amber-700"
        />
      </div>

      {/* Branch list */}
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:p-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">
              All Branches
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              View, update and manage your registered locations.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />

              <input
                type="text"
                value={search}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="Search name, code or city..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-sm text-slate-700 outline-none transition placeholder:text-slate-400 focus:border-[#F4510B] focus:bg-white sm:w-64"
              />
            </div>

            <select
              value={status}
              onChange={(event) =>
                handleStatusChange(
                  event.target.value as 'all' | 'active' | 'inactive',
                )
              }
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#F4510B] sm:w-40"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>

            <button
              type="button"
              onClick={() => void loadBranches()}
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={loading ? 'animate-spin' : ''}
              />
              Refresh
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex min-h-64 flex-col items-center justify-center gap-3">
            <RefreshCw size={28} className="animate-spin text-[#F4510B]" />
            <p className="text-sm text-slate-500">Loading branches...</p>
          </div>
        ) : branches.length === 0 ? (
          <div className="flex min-h-72 flex-col items-center justify-center px-5 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-50 text-[#F4510B]">
              <Building2 size={30} />
            </div>

            <h3 className="text-lg font-semibold text-slate-800">
              {search || status !== 'all'
                ? 'No branches found'
                : 'No branches yet'}
            </h3>

            <p className="mt-2 max-w-sm text-sm text-slate-500">
              {search || status !== 'all'
                ? 'Try changing your search or status filter.'
                : 'Start by adding your first gym branch.'}
            </p>

            {!search && status === 'all' && (
              <button
                type="button"
                onClick={openAddModal}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D94308]"
              >
                <Plus size={17} />
                Add Branch
              </button>
            )}
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-6 py-4 font-semibold">Branch</th>
                    <th className="px-6 py-4 font-semibold">Location</th>
                    <th className="px-6 py-4 font-semibold">Contact</th>
                    <th className="px-6 py-4 font-semibold">Manager</th>
                    <th className="px-6 py-4 font-semibold">Status</th>
                    <th className="px-6 py-4 text-right font-semibold">Actions</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {branches.map((branch) => (
                    <tr
                      key={branch._id}
                      className="transition hover:bg-slate-50/70"
                    >
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                            <Building2 size={20} />
                          </div>

                          <div>
                            <p className="font-semibold text-slate-800">
                              {branch.name}
                            </p>
                            <p className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                              <Hash size={12} />
                              {branch.code}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-start gap-2 text-xs text-slate-600">
                          <MapPin size={14} className="mt-0.5 shrink-0 text-slate-400" />
                          <div>
                            <p>{branch.city || '—'}</p>
                            <p className="mt-1 text-slate-400">
                              {branch.state || branch.address || ''}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="space-y-1.5">
                          {branch.phone && (
                            <p className="flex items-center gap-2 text-xs text-slate-600">
                              <Phone size={13} className="text-slate-400" />
                              {branch.phone}
                            </p>
                          )}

                          {branch.email && (
                            <p className="flex items-center gap-2 text-xs text-slate-600">
                              <Mail size={13} className="text-slate-400" />
                              {branch.email}
                            </p>
                          )}

                          {!branch.phone && !branch.email && (
                            <span className="text-xs text-slate-400">
                              No contact details
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <UserRound size={14} className="text-slate-400" />
                          {branch.managerName || 'Not assigned'}
                        </div>
                      </td>

                      <td className="px-6 py-5">
                        <StatusBadge isActive={branch.isActive} />
                      </td>

                      <td className="px-6 py-5">
                        <div className="flex justify-end gap-2">
                          <ActionButton
                            title="Branch settings"
                            onClick={() => goToSettings(branch)}
                          >
                            <Settings size={16} />
                          </ActionButton>

                          <ActionButton
                            title="Edit branch"
                            onClick={() => openEditModal(branch)}
                          >
                            <Pencil size={16} />
                          </ActionButton>

                          <button
                            type="button"
                            onClick={() => void handleStatusToggle(branch)}
                            title={branch.isActive ? 'Deactivate branch' : 'Activate branch'}
                            className={`rounded-lg border p-2 transition ${
                              branch.isActive
                                ? 'border-slate-200 text-slate-500 hover:border-red-200 hover:bg-red-50 hover:text-red-600'
                                : 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                            }`}
                          >
                            <Power size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="grid gap-3 p-4 md:hidden">
              {branches.map((branch) => (
                <div
                  key={branch._id}
                  className="rounded-xl border border-slate-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
                        <Building2 size={19} />
                      </div>

                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-slate-800">
                          {branch.name}
                        </h3>
                        <p className="mt-1 text-xs text-slate-500">
                          {branch.code}
                        </p>
                      </div>
                    </div>

                    <StatusBadge isActive={branch.isActive} />
                  </div>

                  <div className="mt-4 space-y-2 border-t border-slate-100 pt-3">
                    <p className="flex items-center gap-2 text-xs text-slate-600">
                      <MapPin size={14} className="text-slate-400" />
                      {[branch.city, branch.state].filter(Boolean).join(', ') || branch.address || 'Location not added'}
                    </p>

                    {branch.phone && (
                      <p className="flex items-center gap-2 text-xs text-slate-600">
                        <Phone size={14} className="text-slate-400" />
                        {branch.phone}
                      </p>
                    )}

                    {branch.email && (
                      <p className="flex items-center gap-2 break-all text-xs text-slate-600">
                        <Mail size={14} className="text-slate-400" />
                        {branch.email}
                      </p>
                    )}

                    <p className="flex items-center gap-2 text-xs text-slate-600">
                      <UserRound size={14} className="text-slate-400" />
                      {branch.managerName || 'Manager not assigned'}
                    </p>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => goToSettings(branch)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Settings size={14} />
                      Settings
                    </button>

                    <button
                      type="button"
                      onClick={() => openEditModal(branch)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Pencil size={14} />
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() => void handleStatusToggle(branch)}
                      className="inline-flex items-center justify-center gap-1 rounded-lg border border-slate-200 py-2 text-xs font-medium text-slate-600 hover:bg-slate-50"
                    >
                      <Power size={14} />
                      {branch.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {!loading && pagination.total > 0 && (
          <div className="flex flex-col gap-3 border-t border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p className="text-xs text-slate-500">
              Showing <span className="font-semibold text-slate-700">{startRecord}</span>–
              <span className="font-semibold text-slate-700">{endRecord}</span> of{' '}
              <span className="font-semibold text-slate-700">{pagination.total}</span> branches
            </p>

            <div className="flex items-center justify-between gap-2 sm:justify-end">
              <span className="mr-2 text-xs text-slate-500">
                Page {pagination.page} of {Math.max(pagination.totalPages, 1)}
              </span>

              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page <= 1}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Previous page"
              >
                <ChevronLeft size={17} />
              </button>

              <button
                type="button"
                onClick={() =>
                  setPage((current) =>
                    Math.min(pagination.totalPages, current + 1),
                  )
                }
                disabled={page >= pagination.totalPages}
                className="rounded-lg border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Next page"
              >
                <ChevronRight size={17} />
              </button>
            </div>
          </div>
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
          <div className="my-auto w-full max-w-2xl overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  {editingBranch ? 'Edit Branch' : 'Add New Branch'}
                </h2>
                <p className="mt-1 text-xs text-slate-500">
                  {editingBranch
                    ? 'Update your branch information.'
                    : 'Enter the details to register a new branch.'}
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50"
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="max-h-[70vh] space-y-5 overflow-y-auto p-6">
                {error && (
                  <AlertMessage
                    type="error"
                    message={error}
                    onClose={() => setError('')}
                  />
                )}

                <div className="grid gap-5 sm:grid-cols-2">
                  <FormField label="Branch Name" required>
                    <input
                      required
                      maxLength={100}
                      value={form.name}
                      onChange={(event) => updateField('name', event.target.value)}
                      placeholder="e.g. Meerut Main Branch"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Branch Code" required>
                    <input
                      required
                      maxLength={30}
                      value={form.code}
                      onChange={(event) => updateField('code', event.target.value)}
                      placeholder="e.g. MRT001"
                      className="form-input uppercase"
                    />
                  </FormField>

                  <FormField label="City">
                    <input
                      value={form.city || ''}
                      onChange={(event) => updateField('city', event.target.value)}
                      placeholder="Enter city"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="State">
                    <input
                      value={form.state || ''}
                      onChange={(event) => updateField('state', event.target.value)}
                      placeholder="Enter state"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Phone Number">
                    <input
                      type="tel"
                      value={form.phone || ''}
                      onChange={(event) => updateField('phone', event.target.value)}
                      placeholder="Enter phone number"
                      className="form-input"
                    />
                  </FormField>

                  <FormField label="Email Address">
                    <input
                      type="email"
                      value={form.email || ''}
                      onChange={(event) => updateField('email', event.target.value)}
                      placeholder="branch@example.com"
                      className="form-input"
                    />
                  </FormField>
                </div>

                <FormField label="Branch Address">
                  <textarea
                    rows={3}
                    value={form.address || ''}
                    onChange={(event) => updateField('address', event.target.value)}
                    placeholder="Enter complete branch address"
                    className="form-input resize-none"
                  />
                </FormField>

                <FormField label="GST Number">
                  <input
                    maxLength={15}
                    value={form.gstNumber || ''}
                    onChange={(event) => updateField('gstNumber', event.target.value)}
                    placeholder="e.g. 09ABCDE1234F1Z5"
                    className="form-input uppercase"
                  />
                  <p className="mt-1.5 text-xs text-slate-400">
                    Optional. Enter a valid 15-character GSTIN.
                  </p>
                </FormField>
              </div>

              <div className="flex flex-col-reverse gap-3 border-t border-slate-100 bg-slate-50 px-6 py-4 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={saving}
                  className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-100 disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={saving}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#D94308] disabled:opacity-60"
                >
                  {saving && <RefreshCw size={15} className="animate-spin" />}
                  {saving
                    ? 'Saving...'
                    : editingBranch
                      ? 'Update Branch'
                      : 'Create Branch'}
                </button>
              </div>
            </form>
          </div>
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
          border-color: #F4510B;
          background: #ffffff;
          box-shadow: 0 0 0 3px rgba(244, 81, 11, 0.10);
        }
      `}</style>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  description,
  iconClass,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  description: string;
  iconClass: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <p className="mt-3 text-3xl font-bold tracking-tight text-slate-800">
            {value}
          </p>
          <p className="mt-2 text-xs text-slate-400">{description}</p>
        </div>

        <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
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
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-xs font-semibold text-slate-700">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </span>
      {children}
    </label>
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

      <button type="button" onClick={onClose} className="ml-auto">
        <X size={17} />
      </button>
    </div>
  );
}

function ActionButton({
  title,
  onClick,
  children,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="rounded-lg border border-slate-200 p-2 text-slate-500 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B]"
    >
      {children}
    </button>
  );
}
