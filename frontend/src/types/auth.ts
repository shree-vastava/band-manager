export interface User {
  id: number;
  email: string;
  name: string;
  is_active: boolean;
  created_at: string;
  has_band: boolean;  // Add this
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  name: string;
  // Remove band_name from here
}

export interface GoogleAuthCallback {
  code: string;
  band_name?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: LoginRequest) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}