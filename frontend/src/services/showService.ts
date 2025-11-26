import api from './api';
import { 
  Show, 
  ShowCreate, 
  ShowUpdate, 
  ShowPayment, 
  ShowPaymentCreate, 
  ShowPaymentUpdate,
  PaymentSummary 
} from '../types/show';

export const showService = {
  // Show CRUD
  async createShow(data: ShowCreate): Promise<Show> {
    const response = await api.post<Show>('/api/v1/shows/', data);
    return response.data;
  },

  async getBandShows(bandId: number): Promise<Show[]> {
    const response = await api.get<Show[]>(`/api/v1/shows/band/${bandId}`);
    return response.data;
  },

  async getShow(showId: number): Promise<Show> {
    const response = await api.get<Show>(`/api/v1/shows/${showId}`);
    return response.data;
  },

  async updateShow(showId: number, data: ShowUpdate): Promise<Show> {
    const response = await api.put<Show>(`/api/v1/shows/${showId}`, data);
    return response.data;
  },

  async deleteShow(showId: number): Promise<void> {
    await api.delete(`/api/v1/shows/${showId}`);
  },

  // Poster upload
  async uploadPoster(showId: number, file: File): Promise<{ poster: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/api/v1/shows/${showId}/poster`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  async deletePoster(showId: number): Promise<void> {
    await api.delete(`/api/v1/shows/${showId}/poster`);
  },

  // Show Payments
  async getShowPayments(showId: number): Promise<ShowPayment[]> {
    const response = await api.get<ShowPayment[]>(`/api/v1/shows/${showId}/payments/`);
    return response.data;
  },

  async getPaymentSummary(showId: number): Promise<PaymentSummary> {
    const response = await api.get<PaymentSummary>(`/api/v1/shows/${showId}/payments/summary`);
    return response.data;
  },

  async createPayment(showId: number, data: ShowPaymentCreate): Promise<ShowPayment> {
    const response = await api.post<ShowPayment>(`/api/v1/shows/${showId}/payments/`, data);
    return response.data;
  },

  async updatePayment(showId: number, paymentId: number, data: ShowPaymentUpdate): Promise<ShowPayment> {
    const response = await api.put<ShowPayment>(`/api/v1/shows/${showId}/payments/${paymentId}`, data);
    return response.data;
  },

  async deletePayment(showId: number, paymentId: number): Promise<void> {
    await api.delete(`/api/v1/shows/${showId}/payments/${paymentId}`);
  },
};