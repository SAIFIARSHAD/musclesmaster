
import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Settings,
  Clock,
  CalendarClock,
  Globe,
  IndianRupee,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

import {
  getBranchSettingsApi,
  updateBranchSettingsApi,
  type BranchSettings as BranchSettingsData,
} from '../api/branchSettings.api';

const initialSettings: BranchSettingsData = {
  branchId: '',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
  workingHours: {
    start: '09:00',
    end: '21:00',
  },
  attendanceWindow: {
    checkInStart: '08:00',
    checkInEnd: '11:00',
    checkOutStart: '17:00',
    checkOutEnd: '23:00',
  },
};

const inputClass =
  'mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-[#14243B] outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100';

const labelClass = 'text-sm font-semibold text-slate-700';

const BranchSettings = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  const [settings, setSettings] =
    useState<BranchSettingsData>(initialSettings);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = useCallback(async () => {
    if (!id) {
      setError('Branch ID is missing.');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const data = await getBranchSettingsApi(id);

      setSettings({
        ...initialSettings,
        ...data,
        workingHours: {
          ...initialSettings.workingHours,
          ...data.workingHours,
        },
        attendanceWindow: {
          ...initialSettings.attendanceWindow,
          ...data.attendanceWindow,
        },
      });
    } catch (err: unknown) {
      console.error('Failed to load branch settings:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to load branch settings.';

      setError(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const updateField = (
    field: 'timezone' | 'currency',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateWorkingHours = (
    field: 'start' | 'end',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      workingHours: {
        ...prev.workingHours,
        [field]: value,
      },
    }));
  };

  const updateAttendanceWindow = (
    field:
      | 'checkInStart'
      | 'checkInEnd'
      | 'checkOutStart'
      | 'checkOutEnd',
    value: string
  ) => {
    setSettings((prev) => ({
      ...prev,
      attendanceWindow: {
        ...prev.attendanceWindow,
        [field]: value,
      },
    }));
  };

  const handleSave = async () => {
    if (!id) return;

    setError('');
    setSuccess('');

    if (
      !settings.timezone ||
      !settings.currency ||
      !settings.workingHours.start ||
      !settings.workingHours.end
    ) {
      setError('Please complete all required settings.');
      return;
    }

    if (
      settings.workingHours.start >= settings.workingHours.end
    ) {
      setError('Closing time must be later than opening time.');
      return;
    }

    if (
      settings.attendanceWindow.checkInStart >=
      settings.attendanceWindow.checkInEnd
    ) {
      setError('Check-in end time must be later than start time.');
      return;
    }

    if (
      settings.attendanceWindow.checkOutStart >=
      settings.attendanceWindow.checkOutEnd
    ) {
      setError('Check-out end time must be later than start time.');
      return;
    }

    try {
      setSaving(true);

      const payload = {
        timezone: settings.timezone,
        currency: settings.currency,
        workingHours: settings.workingHours,
        attendanceWindow: settings.attendanceWindow,
      };

      const updated = await updateBranchSettingsApi(id, payload);

      setSettings((prev) => ({
  ...prev,
  ...updated,
  workingHours: {
    ...prev.workingHours,
    ...updated.workingHours,
  },
  attendanceWindow: {
    ...prev.attendanceWindow,
    ...updated.attendanceWindow,
  },
}));

setSuccess('Branch settings saved successfully.');

// Redirect to Branch Management after successful save
navigate('/branches');
    } catch (err: unknown) {
      console.error('Failed to save branch settings:', err);

      const message =
        err instanceof Error
          ? err.message
          : 'Unable to save branch settings.';

      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-[#F4510B]" />
          <p className="mt-4 text-sm text-slate-500">
            Loading branch settings...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">

      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={() => navigate('/branches')}
            className="mt-1 rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[#F4510B]"
          >
            <ArrowLeft size={19} />
          </button>

          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span>Admin Console</span>
              <span>/</span>
              <button
                type="button"
                onClick={() => navigate('/branches')}
                className="hover:text-[#F4510B]"
              >
                Branch Management
              </button>
              <span>/</span>
              <span className="text-[#F4510B]">Settings</span>
            </div>

            <h1 className="mt-2 text-2xl font-extrabold text-[#14243B]">
              Branch Settings
            </h1>

            <p className="mt-1 text-sm text-slate-500">
              Configure working hours, timezone and attendance preferences.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={loadSettings}
          disabled={loading || saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {/* Notifications */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={19} className="mt-0.5 shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          <CheckCircle2 size={19} className="mt-0.5 shrink-0" />
          <p>{success}</p>
        </div>
      )}

      {/* Branch Information */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Settings size={22} />
          </div>

          <div>
            <h2 className="font-bold text-[#14243B]">
              Branch Configuration
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Branch ID: {id}
            </p>
          </div>
        </div>
      </section>

      {/* General Preferences */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Globe size={21} />
          </div>

          <div>
            <h2 className="font-bold text-[#14243B]">
              General Preferences
            </h2>
            <p className="text-sm text-slate-500">
              Set regional preferences for this branch.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Timezone</label>
            <select
              className={inputClass}
              value={settings.timezone}
              onChange={(e) =>
                updateField('timezone', e.target.value)
              }
            >
              <option value="Asia/Kolkata">
                India Standard Time (Asia/Kolkata)
              </option>
              <option value="UTC">UTC</option>
              <option value="Asia/Dubai">Dubai (Asia/Dubai)</option>
              <option value="Europe/London">London (Europe/London)</option>
              <option value="America/New_York">
                New York (America/New_York)
              </option>
            </select>
          </div>

          <div>
            <label className={labelClass}>Currency</label>
            <select
              className={inputClass}
              value={settings.currency}
              onChange={(e) =>
                updateField('currency', e.target.value)
              }
            >
              <option value="INR">INR - Indian Rupee (₹)</option>
              <option value="USD">USD - US Dollar ($)</option>
              <option value="AED">AED - UAE Dirham</option>
              <option value="GBP">GBP - British Pound (£)</option>
            </select>
          </div>
        </div>
      </section>

      {/* Working Hours */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <Clock size={21} />
          </div>

          <div>
            <h2 className="font-bold text-[#14243B]">
              Branch Working Hours
            </h2>
            <p className="text-sm text-slate-500">
              Configure the regular operating hours.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <div>
            <label className={labelClass}>Opening Time</label>
            <input
              type="time"
              className={inputClass}
              value={settings.workingHours.start}
              onChange={(e) =>
                updateWorkingHours('start', e.target.value)
              }
            />
          </div>

          <div>
            <label className={labelClass}>Closing Time</label>
            <input
              type="time"
              className={inputClass}
              value={settings.workingHours.end}
              onChange={(e) =>
                updateWorkingHours('end', e.target.value)
              }
            />
          </div>
        </div>
      </section>

      {/* Attendance Window */}
      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
            <CalendarClock size={21} />
          </div>

          <div>
            <h2 className="font-bold text-[#14243B]">
              Attendance Time Windows
            </h2>
            <p className="text-sm text-slate-500">
              Define when employees can mark their attendance.
            </p>
          </div>
        </div>

        {/* Check-in */}
        <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-green-500" />
            <h3 className="font-bold text-[#14243B]">
              Check-in Window
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Check-in Start</label>
              <input
                type="time"
                className={inputClass}
                value={settings.attendanceWindow.checkInStart}
                onChange={(e) =>
                  updateAttendanceWindow('checkInStart', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Check-in End</label>
              <input
                type="time"
                className={inputClass}
                value={settings.attendanceWindow.checkInEnd}
                onChange={(e) =>
                  updateAttendanceWindow('checkInEnd', e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Check-out */}
        <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
          <div className="mb-5 flex items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full bg-orange-500" />
            <h3 className="font-bold text-[#14243B]">
              Check-out Window
            </h3>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label className={labelClass}>Check-out Start</label>
              <input
                type="time"
                className={inputClass}
                value={settings.attendanceWindow.checkOutStart}
                onChange={(e) =>
                  updateAttendanceWindow('checkOutStart', e.target.value)
                }
              />
            </div>

            <div>
              <label className={labelClass}>Check-out End</label>
              <input
                type="time"
                className={inputClass}
                value={settings.attendanceWindow.checkOutEnd}
                onChange={(e) =>
                  updateAttendanceWindow('checkOutEnd', e.target.value)
                }
              />
            </div>
          </div>
        </div>
      </section>

      {/* Save Actions */}
      <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => navigate('/branches')}
          disabled={saving}
          className="rounded-xl border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-7 py-3 text-sm font-bold text-white shadow-md shadow-orange-900/10 transition hover:bg-[#D94308] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {saving ? (
            <>
              <RefreshCw size={17} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={17} />
              Save Settings
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default BranchSettings;
