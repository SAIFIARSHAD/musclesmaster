
export interface MemberLookupItem {
  _id: string;
  memberId: string;
  firstName: string;
  lastName: string;
  email?: string;
  mobile: string;
}

export interface PendingMembershipLookupItem {
  _id: string;
  memberId: MemberLookupItem;
  planId: {
    _id: string;
    planName: string;
    planType?: string;
    duration?: number;
    price: number;
  };
  branchId: {
    _id: string;
    name: string;
    code?: string;
  };
  agreedAmount: number;
  status: string;
  startDate: string;
  endDate: string;
}

export interface MemberSearchFilters {
  search: string;
  page?: number;
  limit?: number;
}


export interface PendingMembershipFilters {
  memberId?: string;
  status?: 'PENDING';
  page?: number;
  limit?: number;
}

