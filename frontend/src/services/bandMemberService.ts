import api from './api';
import { BandMember, BandMemberCreate, BandMemberUpdate } from '../types/bandMember';

export const bandMemberService = {
  async getMembers(bandId: number): Promise<BandMember[]> {
    const response = await api.get<BandMember[]>(`/api/v1/bands/${bandId}/members/`);
    return response.data;
  },

  async createMember(bandId: number, data: BandMemberCreate): Promise<BandMember> {
    const response = await api.post<BandMember>(`/api/v1/bands/${bandId}/members/`, data);
    return response.data;
  },

  async updateMember(bandId: number, memberId: number, data: BandMemberUpdate): Promise<BandMember> {
    const response = await api.put<BandMember>(`/api/v1/bands/${bandId}/members/${memberId}`, data);
    return response.data;
  },

  async deleteMember(bandId: number, memberId: number): Promise<void> {
    await api.delete(`/api/v1/bands/${bandId}/members/${memberId}`);
  },

  async uploadProfilePicture(bandId: number, memberId: number, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post(`/api/v1/bands/${bandId}/members/${memberId}/profile-picture`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
},


};