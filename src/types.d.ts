
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
  email: string;
  firstName: string;
  lastName: string;
  walletBalance: number;
  roles: AppRole[];
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
  complainant_id: string;
  respondent_id: string;
  amount: number;
  status: 'pending' | 'resolved' | 'rejected';
  transaction_id: string;
  description: string;
  resolution?: string;
  ruling?: 'upheld' | 'rejected' | null;
}
