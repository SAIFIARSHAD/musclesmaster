
import { useEffect, useState } from 'react';
import { UserRound, Save, Loader2 } from 'lucide-react';

import { getTrainersApi } from '../../api/trainers.api';
import { updateMemberTrainerApi } from '../../api/members.api';

import type { Trainer } from '../../types/trainer.types';

interface TrainerAssignmentProps {
  memberId: string;
  currentTrainer: {
    _id: string;
    name: string;
  } | null;
  onSuccess: () => void;
}

const TrainerAssignment = ({
  memberId,
  currentTrainer,
  onSuccess,
}: TrainerAssignmentProps) => {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [selectedTrainerId, setSelectedTrainerId] = useState(
    currentTrainer?._id ?? '',
  );

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let isMounted = true;

    const fetchTrainers = async () => {
      try {
        setIsLoading(true);

        const result = await getTrainersApi();

        if (isMounted) {
          setTrainers(result);
        }
      } catch {
        if (isMounted) {
          setError('Unable to load trainers. Please try again.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    fetchTrainers();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleAssignTrainer = async () => {
    try {
      setIsSaving(true);
      setError('');
      setSuccess('');

      await updateMemberTrainerApi(
        memberId,
        selectedTrainerId || null,
      );

      setSuccess('Trainer assignment updated successfully.');

      onSuccess();
    } catch (err: unknown) {
      const message =
        typeof err === 'object' &&
        err !== null &&
        'response' in err
          ? (
              err as {
                response?: {
                  data?: { message?: string };
                };
              }
            ).response?.data?.message
          : undefined;

      setError(message || 'Unable to update trainer assignment.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#F4510B]">
          <UserRound size={20} />
        </div>

        <div>
          <h3 className="font-semibold text-[#14243B]">
            Trainer Assignment
          </h3>
          <p className="text-xs text-slate-500">
            Assign an active trainer to this member
          </p>
        </div>
      </div>

      {currentTrainer && (
        <p className="mb-3 text-sm text-slate-600">
          Currently assigned: <strong>{currentTrainer.name}</strong>
        </p>
      )}

      <label
        htmlFor="member-trainer"
        className="mb-2 block text-sm font-medium text-slate-700"
      >
        Select Trainer
      </label>

      {isLoading ? (
        <div className="flex items-center gap-2 py-3 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" />
          Loading trainers...
        </div>
      ) : (
        <select
          id="member-trainer"
          value={selectedTrainerId}
          onChange={(event) => {
            setSelectedTrainerId(event.target.value);
            setError('');
            setSuccess('');
          }}
          className="w-full rounded-xl border border-slate-200 bg-white px-3 py-3 text-sm outline-none transition focus:border-[#F4510B] focus:ring-2 focus:ring-orange-100"
        >
          <option value="">No trainer assigned</option>

          {currentTrainer &&
            !trainers.some(
              (trainer) => trainer._id === currentTrainer._id,
            ) && (
              <option value={currentTrainer._id}>
                {currentTrainer.name} (currently assigned)
              </option>
            )}

          {trainers.map((trainer) => (
            <option key={trainer._id} value={trainer._id}>
              {trainer.name} — {trainer.email}
            </option>
          ))}
        </select>
      )}

      {error && (
        <p className="mt-3 text-sm text-red-600">{error}</p>
      )}

      {success && (
        <p className="mt-3 text-sm text-green-600">{success}</p>
      )}

      <button
        type="button"
        onClick={handleAssignTrainer}
        disabled={isLoading || isSaving}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#F4510B] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-orange-600 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSaving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}

        {isSaving ? 'Saving...' : 'Save Assignment'}
      </button>
    </div>
  );
};

export default TrainerAssignment;
