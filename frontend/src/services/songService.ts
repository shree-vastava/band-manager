import api from './api';
import {
  Song,
  SongCreate,
  SongUpdate,
  SongWithSetlists
} from '../types/song';

export const songService = {
  async createSong(data: SongCreate): Promise<SongWithSetlists> {
    const response = await api.post<SongWithSetlists>('/api/v1/songs/', data);
    return response.data;
  },

  async getBandSongs(bandId: number): Promise<SongWithSetlists[]> {
    const response = await api.get<SongWithSetlists[]>(`/api/v1/songs/band/${bandId}`);
    return response.data;
  },

  async getSong(songId: number): Promise<SongWithSetlists> {
    const response = await api.get<SongWithSetlists>(`/api/v1/songs/${songId}`);
    return response.data;
  },

  async updateSong(songId: number, data: SongUpdate): Promise<SongWithSetlists> {
    const response = await api.put<SongWithSetlists>(`/api/v1/songs/${songId}`, data);
    return response.data;
  },

  async deleteSong(songId: number): Promise<void> {
    await api.delete(`/api/v1/songs/${songId}`);
  },

  async addSongToSetlist(songId: number, setlistId: number): Promise<void> {
    await api.post(`/api/v1/songs/${songId}/setlists/${setlistId}`);
  },

  async removeSongFromSetlist(songId: number, setlistId: number): Promise<void> {
    await api.delete(`/api/v1/songs/${songId}/setlists/${setlistId}`);
  },

  async updateSongSetlists(songId: number, setlistIds: number[]): Promise<SongWithSetlists> {
    const response = await api.put<SongWithSetlists>(`/api/v1/songs/${songId}/setlists`, setlistIds);
    return response.data;
  },

  async toggleSongActive(songId: number): Promise<SongWithSetlists> {
  // First get current song to know its status
  const song = await this.getSong(songId);
  const response = await api.put<SongWithSetlists>(`/api/v1/songs/${songId}`, {
    is_active: !song.is_active
  });
  return response.data;
},
};