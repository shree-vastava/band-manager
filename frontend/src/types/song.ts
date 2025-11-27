export interface Song {
  id: number;
  band_id: number;
  title: string;
  description?: string | null;
  scale?: string | null;
  genre?: string | null;
  lyrics?: string | null;
  chord_structure?: string | null;
  lyrics_with_chords?: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface SongCreate {
  band_id: number;
  title: string;
  description?: string | null;
  scale?: string | null;
  genre?: string | null;
  lyrics?: string | null;
  chord_structure?: string | null;
  lyrics_with_chords?: string | null;
  is_active?: boolean;
  setlist_ids?: number[] | null;
}

export interface SongUpdate {
  title?: string;
  description?: string | null;
  scale?: string | null;
  genre?: string | null;
  lyrics?: string | null;
  chord_structure?: string | null;
  lyrics_with_chords?: string | null;
  is_active?: boolean;
}

export interface SetlistBrief {
  id: number;
  name: string;
}

export interface SongWithSetlists extends Song {
  setlists: SetlistBrief[];
}