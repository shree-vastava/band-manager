import api from './api';
import { Band, BandCreate, BandUpdate } from '../types/band';

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

  async updateBand(bandId: number, data: BandUpdate): Promise<Band> {
    const response = await api.put<Band>(`/api/v1/bands/${bandId}`, data);
    return response.data;
  },

  async deleteBand(bandId: number): Promise<void> {
    await api.delete(`/api/v1/bands/${bandId}`);
  },

  async uploadLogo(bandId: number, file: File): Promise<any> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/v1/bands/${bandId}/logo`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deleteLogo(bandId: number): Promise<any> {
    const response = await api.delete(`/api/v1/bands/${bandId}/logo`);
    return response.data;
  },

  // Keeping this for backward compatibility
  async updateBandName(bandId: number, name: string): Promise<Band> {
    return this.updateBand(bandId, { name });
  },
};