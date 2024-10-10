import type { NavItemConfig } from '@/types/nav';
import { paths } from '@/paths';

export const navItems = [
  { key: 'home', title: 'Inicio', href: paths.dashboard.overview, icon: 'house' },
  { key: 'customers', title: 'Usuarios', href: paths.dashboard.customers, icon: 'users' },
  { key: 'inventory', title: 'Inventario', href: paths.dashboard.integrations, icon: 'box' },
  // { key: 'reports', title: 'Reportes', href: paths.errors.notFound, icon: 'scroll' },
  { key: 'account', title: 'Cuenta', href: paths.dashboard.account, icon: 'user' },
  { key: 'settings', title: 'Configuración', href: paths.dashboard.settings, icon: 'gear-six' },
] satisfies NavItemConfig[];
