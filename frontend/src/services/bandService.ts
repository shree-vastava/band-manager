import api from './api';
import { Band, BandCreate } from '../types/band';

export const bandService = {
  async createBand(data: BandCreate): Promise<Band> {
    const response = await api.post<Band>('/api/v1/bands/', data);
    return response.data;
  },

  async getUserBands(): Promise<Band[]> {
    const response = await api.get<Band[]>('/api/v1/bands/');
    return response.data;
  },

  async getBand(bandId: number): Promise<Band> {
    const response = await api.get<Band>(`/api/v1/bands/${bandId}`);
    return response.data;
  },

  async updateBandName(bandId: number, name: string): Promise<Band> {
    const response = await api.put<Band>(`/api/v1/bands/${bandId}`, { name });
    return response.data;
  },
};