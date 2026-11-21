
import type { AxiosInstance } from 'axios';
import type { PaginatedApiResponse } from '../types/api.types';
import type {
  MemberSearchFilters,
  MemberLookupItem,
  PendingMembershipFilters,
  PendingMembershipLookupItem,
} from '../types/collection.types';

export const createCollectionLookupService = (http: AxiosInstance) => ({
  async searchMembers(
    filters: MemberSearchFilters,
  ): Promise<PaginatedApiResponse<MemberLookupItem>> {
    const response = await http.get('/members', {
      params: filters,
    });

    return response.data;
  },

  async getPendingMemberships(
    filters: PendingMembershipFilters,
  ): Promise<PaginatedApiResponse<PendingMembershipLookupItem>> {
    const response = await http.get('/memberships', {
      params: filters,
    });

    return response.data;
  },
});

export type CollectionLookupService =
  ReturnType<typeof createCollectionLookupService>;
