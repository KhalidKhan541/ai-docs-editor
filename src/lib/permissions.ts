import { User, UserRole } from '@/types'

export interface PermissionCheck {
  allowed: boolean
  reason?: string
}

const ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  editor: 2,
  viewer: 1,
}

const PERMISSION_MATRIX: Record<UserRole, string[]> = {
  admin: [
    'document:create',
    'document:read',
    'document:update',
    'document:delete',
    'document:share',
    'document:publish',
    'document:export',
    'comment:create',
    'comment:read',
    'comment:update',
    'comment:delete',
    'comment:resolve',
    'suggestion:create',
    'suggestion:read',
    'suggestion:accept',
    'suggestion:reject',
    'user:manage',
    'template:manage',
  ],
  editor: [
    'document:create',
    'document:read',
    'document:update',
    'document:export',
    'comment:create',
    'comment:read',
    'comment:update',
    'suggestion:create',
    'suggestion:read',
  ],
  viewer: [
    'document:read',
    'comment:create',
    'comment:read',
    'suggestion:read',
  ],
}

export function checkPermission(
  user: User,
  action: string,
  resourceOwnerId?: string
): PermissionCheck {
  const permissions = PERMISSION_MATRIX[user.role]
  if (!permissions) {
    return { allowed: false, reason: 'Unknown role' }
  }

  if (!permissions.includes(action)) {
    return {
      allowed: false,
      reason: `Role '${user.role}' does not have permission for '${action}'`,
    }
  }

  if (resourceOwnerId && user.role !== 'admin' && user.id !== resourceOwnerId) {
    if (action.includes('delete') || action.includes('manage')) {
      return {
        allowed: false,
        reason: 'Only the resource owner or admin can perform this action',
      }
    }
  }

  return { allowed: true }
}

export function canCreateDocument(user: User): boolean {
  return checkPermission(user, 'document:create').allowed
}

export function canReadDocument(user: User): boolean {
  return checkPermission(user, 'document:read').allowed
}

export function canUpdateDocument(
  user: User,
  resourceOwnerId: string
): boolean {
  return checkPermission(user, 'document:update', resourceOwnerId).allowed
}

export function canDeleteDocument(
  user: User,
  resourceOwnerId: string
): boolean {
  return checkPermission(user, 'document:delete', resourceOwnerId).allowed
}

export function canShareDocument(user: User): boolean {
  return checkPermission(user, 'document:share').allowed
}

export function canPublishDocument(user: User): boolean {
  return checkPermission(user, 'document:publish').allowed
}

export function canExportDocument(user: User): boolean {
  return checkPermission(user, 'document:export').allowed
}

export function canManageUsers(user: User): boolean {
  return checkPermission(user, 'user:manage').allowed
}

export function canManageTemplates(user: User): boolean {
  return checkPermission(user, 'template:manage').allowed
}

export function getRoleLevel(role: UserRole): number {
  return ROLE_HIERARCHY[role] ?? 0
}

export function hasHigherRole(
  userRole: UserRole,
  targetRole: UserRole
): boolean {
  return getRoleLevel(userRole) > getRoleLevel(targetRole)
}

export function getPermissionsForRole(role: UserRole): string[] {
  return [...(PERMISSION_MATRIX[role] ?? [])]
}

export function getAllRoles(): UserRole[] {
  return Object.keys(ROLE_HIERARCHY) as UserRole[]
}

export function isValidRole(role: string): role is UserRole {
  return role in ROLE_HIERARCHY
}

export function isOwner(user: User, resourceOwnerId: string): boolean {
  return user.id === resourceOwnerId
}

export function canEdit(
  user: User,
  resourceOwnerId: string
): PermissionCheck {
  if (user.role === 'admin') return { allowed: true }
  if (user.id === resourceOwnerId) return { allowed: true }
  if (user.role === 'editor') return { allowed: true }
  return { allowed: false, reason: 'Insufficient permissions to edit' }
}

export function canComment(user: User): PermissionCheck {
  return checkPermission(user, 'comment:create')
}

export function canResolveComments(user: User): PermissionCheck {
  return checkPermission(user, 'comment:resolve')
}
