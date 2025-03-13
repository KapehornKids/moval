
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
