import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems: NavItemConfig[] = [
  { 
    key: 'home', 
    title: 'Inicio', 
    href: paths.dashboard.overview, 
    icon: 'house',
  },
  { 
    key: 'supermarket', 
    title: 'Supermercado', 
    href: paths.dashboard.supermarket, 
    icon: 'shopping-cart',
    roles: ['admin', 'owner', 'viewer']
  },
  { 
    key: 'customers',
    title: 'Usuarios',
    href: paths.dashboard.customers,
    icon: 'users',
    roles: ['admin', 'owner', 'viewer']
  },
  {
    key: 'categories', 
    title: 'Categorías', 
    href: paths.dashboard.categories, 
    icon: 'scroll',
    
  },
  { 
    key: 'inventory', 
    title: 'Inventario', 
    href: paths.dashboard.inventory, 
    icon: 'box',
  },
    { 
    key: 'sales', 
    title: 'Ventas', 
    href: paths.dashboard.sales, 
    icon: 'chart-bar',
    roles: ['admin', 'owner', 'cashier']
  },
  { 
    key: 'sales-history', 
    title: 'Historial de Ventas', 
    href: paths.dashboard.sales_history, 
    icon: 'history',
  },
  { 
    key: 'predictions', 
    title: 'Predicciones', 
    href: paths.dashboard.predictions, 
    icon: 'line-segments',
  }, 
  { 
    key: 'reports', 
    title: 'Reportes', 
    href: paths.dashboard.reports, 
    icon: 'article',
    roles: ['admin', 'owner', 'viewer']
  },
  { 
    key: 'audits', 
    title: 'Auditorias', 
    href: paths.dashboard.audits, 
    icon: 'book-open-text',
    roles: ['admin', 'owner']
  },
  { 
    key: 'account', 
    title: 'Cuenta', 
    href: paths.dashboard.account, 
    icon: 'user',
  },
  { 
    key: 'settings', 
    title: 'Configuración', 
    href: paths.dashboard.settings, 
    icon: 'gear-six',
    roles: ['admin', 'owner']
  },
];
