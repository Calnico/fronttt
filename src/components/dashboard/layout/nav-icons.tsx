import type { Icon } from '@phosphor-icons/react/dist/lib/types';
import { User as UserIcon } from '@phosphor-icons/react/dist/ssr/User';
import { Users as UsersIcon } from '@phosphor-icons/react/dist/ssr/Users';
import { House, Scroll, ChartBar, ClockCounterClockwise, LineSegments, Article, BookOpenText } from '@phosphor-icons/react';
import { BoxArrowUp } from '@phosphor-icons/react/dist/ssr';
import { GearSix as GearSixIcon } from '@phosphor-icons/react/dist/ssr/GearSix';
import { ShoppingCart as ShoppingCartIcon } from '@phosphor-icons/react/dist/ssr/ShoppingCart';

export const navIcons = {
  article: Article,
  'history': ClockCounterClockwise,
  'chart-bar': ChartBar,
  'gear-six': GearSixIcon,
  'line-segments': LineSegments,
  box: BoxArrowUp,
  house: House,
  scroll: Scroll,
  user: UserIcon,
  users: UsersIcon,
  'shopping-cart' : ShoppingCartIcon,
  'book-open-text' : BookOpenText,
} as Record<string, Icon>;