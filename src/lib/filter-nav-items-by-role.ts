import type { NavItemConfig, UserRole } from "@/types/nav";

export function filterNavItemsByRole(items: NavItemConfig[], userRole: UserRole): NavItemConfig[] {
  return items.filter((item) => {
    if (!item.roles) return true;

    return item.roles.includes(userRole);
  });
}
