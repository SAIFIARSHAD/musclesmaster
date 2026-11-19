
import { http } from './axiosInstance';

export interface Trainer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'TRAINER';
  branchId: string;
  isActive: boolean;
}

interface TrainerListResponse {
  success: boolean;
  message: string;
  data: Trainer[];
}

export const getReceptionTrainersApi = async (): Promise<Trainer[]> => {
  const response = await http.get<TrainerListResponse>(
    '/reception/trainers',
  );

  return response.data.data;
};
