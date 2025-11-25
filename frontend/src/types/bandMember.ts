export interface BandMember {
  id: number;
  band_id: number;
  user_id?: number | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  profile_picture?: string | null;
  role?: string | null;
  is_admin: boolean;
  is_active: boolean;
  joined_at: string;
}

export interface BandMemberCreate {
  name: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_admin?: boolean;
}

export interface BandMemberUpdate {
  name?: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  is_admin?: boolean;
}