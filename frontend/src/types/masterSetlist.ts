export interface MasterSetlist {
  id: number;
  band_id: number;
  name: string;
  description?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  song_count?: number;
}

export interface MasterSetlistCreate {
  band_id: number;
  name: string;
  description?: string | null;
}

export interface MasterSetlistUpdate {
  name?: string;
  description?: string | null;
}

export interface SongBrief {
  id: number;
  title: string;
  scale?: string | null;
  genre?: string | null;
  position?: number;
}

export interface MasterSetlistWithSongs extends MasterSetlist {
  songs: SongBrief[];
}