
import { NavItem } from '@/types';

export const getHeaderItems = (): NavItem[] => {
  return [
    {
      title: 'Home',
      href: '/',
      public: true
    },
    {
      title: 'Dashboard',
      href: '/dashboard',
    },
    {
      title: 'Finances',
      children: [
        {
          title: 'Send Money',
          href: '/send-money',
        },
        {
          title: 'Receive Money',
          href: '/receive-money',
        },
        {
          title: 'Loans',
          href: '/loans',
        },
        {
          title: 'Transactions',
          href: '/transactions',
        }
      ]
    },
    {
      title: 'Community',
      children: [
        {
          title: 'Profile',
          href: '/profile',
        },
        {
          title: 'Chainbook',
          href: '/chainbook',
        },
        {
          title: 'Voting',
          href: '/voting',
        }
      ]
    },
    {
      title: 'Admin',
      children: [
        {
          title: 'Association',
          href: '/association',
          roles: ['association_member']
        },
        {
          title: 'Justice',
          href: '/justice',
          roles: ['justice_department']
        },
        {
          title: 'Justice Admin',
          href: '/justice-admin',
          roles: ['justice_department']
        },
        {
          title: 'Banker Admin',
          href: '/banker-admin',
          roles: ['banker']
        },
        {
          title: 'Users',
          href: '/users',
          roles: ['association_member']
        },
        {
          title: 'Admin Setup',
          href: '/admin-setup',
          roles: ['association_member']
        }
      ]
    },
    {
      title: 'Info',
      public: true,
      children: [
        {
          title: 'Terms',
          href: '/terms',
          public: true
        },
        {
          title: 'Privacy',
          href: '/privacy',
          public: true
        }
      ]
    }
  ];
};
