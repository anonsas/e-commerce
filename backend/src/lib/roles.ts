import type { UserRole } from "@ecommerce/shared";
import { USER_ROLES } from "@ecommerce/shared";

const VALID: readonly UserRole[] = [USER_ROLES.customer, USER_ROLES.support, USER_ROLES.admin];

export function parseRole(value: unknown) {
  if (typeof value === "string" && (VALID as readonly string[]).includes(value)) {
    return value as UserRole;
  }
  return "customer";
}

export function isAdmin(role: UserRole) {
  return role === USER_ROLES.admin;
}

export function isStaff(role: UserRole) {
  return role === USER_ROLES.support || role === USER_ROLES.admin;
}
