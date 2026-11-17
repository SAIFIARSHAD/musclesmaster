export interface Trainer {
  _id: string;
  name: string;
  email: string;
  mobile: string;
  role: 'TRAINER';
  branchId: string;
  isActive: boolean;
}

export interface TrainerListResponse {
  success: boolean;
  message: string;
  data: Trainer[];
}
