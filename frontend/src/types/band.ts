export interface Band {
  id: number;
  name: string;
  logo?: string | null;
  established_date?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface BandCreate {
  name: string;
  logo?: string | null;
  established_date?: string | null;
  description?: string | null;
}

export interface BandUpdate {
  name?: string;
  logo?: string | null;
  established_date?: string | null;
  description?: string | null;
}