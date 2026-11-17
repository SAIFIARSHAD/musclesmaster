import { http } from './axiosInstance';

import type {
  Trainer,
  TrainerListResponse,
} from '../types/trainer.types';

export const getTrainersApi = async (): Promise<Trainer[]> => {
  const response =
    await http.get<TrainerListResponse>('/users');

  return response.data.data.filter(
    (user) => user.role === 'TRAINER' && user.isActive,
  );
};
