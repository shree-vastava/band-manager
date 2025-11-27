import api from './api';
import {
  MasterSetlist,
  MasterSetlistCreate,
  MasterSetlistUpdate,
  MasterSetlistWithSongs
} from '../types/masterSetlist';

export const masterSetlistService = {
  async createSetlist(data: MasterSetlistCreate): Promise<MasterSetlist> {
    const response = await api.post<MasterSetlist>('/api/v1/setlists/', data);
    return response.data;
  },

  async getBandSetlists(bandId: number): Promise<MasterSetlist[]> {
    const response = await api.get<MasterSetlist[]>(`/api/v1/setlists/band/${bandId}`);
    return response.data;
  },

  async getSetlist(setlistId: number): Promise<MasterSetlist> {
    const response = await api.get<MasterSetlist>(`/api/v1/setlists/${setlistId}`);
    return response.data;
  },

  async getSetlistWithSongs(setlistId: number): Promise<MasterSetlistWithSongs> {
    const response = await api.get<MasterSetlistWithSongs>(`/api/v1/setlists/${setlistId}/songs`);
    return response.data;
  },

  async updateSetlist(setlistId: number, data: MasterSetlistUpdate): Promise<MasterSetlist> {
    const response = await api.put<MasterSetlist>(`/api/v1/setlists/${setlistId}`, data);
    return response.data;
  },

  async deleteSetlist(setlistId: number): Promise<void> {
    await api.delete(`/api/v1/setlists/${setlistId}`);
  },
};