
export type AppRole = 'user' | 'banker' | 'association_member' | 'justice_department';

export interface NavItem {
  title: string;
  href?: string;
  public?: boolean;
  roles?: AppRole[];
  children?: NavItem[];
}

export interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  walletBalance?: number;
  roles?: AppRole[];
  name?: string;
  role?: string;
  first_name?: string;
  last_name?: string;
  user_roles?: { role: string }[];
}

export interface UserRole {
  role: AppRole;
  user_id: string;
}

export interface UserWithRoles {
  id: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  user_roles?: UserRole[];
}

export interface Dispute {
  id: string;
  created_at: string;
  updated_at?: string;
  complainant_id: string;
  respondent_id: string;
  amount?: number;
  status: 'pending' | 'in_review' | 'resolved' | 'rejected' | 'dismissed';
  transaction_id?: string;
  description: string;
  resolution?: string;
  ruling?: string;
  complainant_name?: string;
  respondent_name?: string;
  evidence?: string;
  ruled_by?: string;
  complainant?: {
    first_name?: string;
    last_name?: string;
  };
  respondent?: {
    first_name?: string;
    last_name?: string;
  };
}
