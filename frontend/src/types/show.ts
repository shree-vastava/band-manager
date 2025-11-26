export enum ShowStatus {
  UPCOMING = "Upcoming",
  CANCELLED = "Cancelled",
  DONE = "Done",
  COMPLETE_PAYMENT_RECEIVED = "Complete - Payment Received",
}

export interface Show {
  id: number;
  band_id: number;
  venue: string;
  show_date: string;
  show_time?: string | null;
  event_manager?: string | null;
  show_members?: string[] | null;
  payment?: number | null;
  band_fund_amount?: number | null;
  piece_count?: number | null;
  status: ShowStatus;
  poster?: string | null;
  description?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShowCreate {
  band_id: number;
  venue: string;
  show_date: string;
  show_time?: string | null;
  event_manager?: string | null;
  show_members?: string[] | null;
  payment?: number | null;
  band_fund_amount?: number | null;
  piece_count?: number | null;
  status?: ShowStatus;
  poster?: string | null;
  description?: string | null;
}

export interface ShowUpdate {
  venue?: string;
  show_date?: string;
  show_time?: string | null;
  event_manager?: string | null;
  show_members?: string[] | null;
  payment?: number | null;
  band_fund_amount?: number | null;
  piece_count?: number | null;
  status?: ShowStatus;
  poster?: string | null;
  description?: string | null;
}

// Show Payment types
export interface ShowPayment {
  id: number;
  show_id: number;
  member_name: string;
  amount: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ShowPaymentCreate {
  member_name: string;
  amount: number;
  notes?: string | null;
}

export interface ShowPaymentUpdate {
  member_name?: string;
  amount?: number;
  notes?: string | null;
}

export interface PaymentSummary {
  show_id: number;
  total_payment: number;
  band_fund_amount: number;
  total_member_payments: number;
  member_payments: ShowPayment[];
}