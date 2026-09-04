import {
  checkPermission,
  canCreateDocument,
  canReadDocument,
  canUpdateDocument,
  canDeleteDocument,
  canShareDocument,
  canPublishDocument,
  canExportDocument,
  canManageUsers,
  canManageTemplates,
  getRoleLevel,
  hasHigherRole,
  getPermissionsForRole,
  getAllRoles,
  isValidRole,
  isOwner,
  canEdit,
  canComment,
  canResolveComments,
} from '@/lib/permissions'
import { User } from '@/types'

function makeUser(role: 'admin' | 'editor' | 'viewer', id?: string): User {
  return { id: id ?? 'user-1', name: 'Test', email: 'test@test.com', role }
}

describe('permissions', () => {
  describe('checkPermission', () => {
    it('allows admin all permissions', () => {
      const user = makeUser('admin')
      expect(checkPermission(user, 'document:create').allowed).toBe(true)
      expect(checkPermission(user, 'document:delete').allowed).toBe(true)
      expect(checkPermission(user, 'user:manage').allowed).toBe(true)
    })

    it('allows editor document operations', () => {
      const user = makeUser('editor')
      expect(checkPermission(user, 'document:create').allowed).toBe(true)
      expect(checkPermission(user, 'document:read').allowed).toBe(true)
      expect(checkPermission(user, 'document:update').allowed).toBe(true)
    })

    it('denies editor delete permission', () => {
      const user = makeUser('editor')
      expect(checkPermission(user, 'document:delete').allowed).toBe(false)
    })

    it('allows viewer read only', () => {
      const user = makeUser('viewer')
      expect(checkPermission(user, 'document:read').allowed).toBe(true)
      expect(checkPermission(user, 'document:create').allowed).toBe(false)
      expect(checkPermission(user, 'document:update').allowed).toBe(false)
    })

    it('denies non-owner delete', () => {
      const user = makeUser('editor')
      expect(checkPermission(user, 'document:delete', 'other-user').allowed).toBe(false)
    })

    it('allows owner delete', () => {
      const user = makeUser('editor')
      expect(checkPermission(user, 'document:delete', 'user-1').allowed).toBe(true)
    })
  })

  describe('canCreateDocument', () => {
    it('returns true for admin', () => {
      expect(canCreateDocument(makeUser('admin'))).toBe(true)
    })

    it('returns true for editor', () => {
      expect(canCreateDocument(makeUser('editor'))).toBe(true)
    })

    it('returns false for viewer', () => {
      expect(canCreateDocument(makeUser('viewer'))).toBe(false)
    })
  })

  describe('canReadDocument', () => {
    it('returns true for all roles', () => {
      expect(canReadDocument(makeUser('admin'))).toBe(true)
      expect(canReadDocument(makeUser('editor'))).toBe(true)
      expect(canReadDocument(makeUser('viewer'))).toBe(true)
    })
  })

  describe('canUpdateDocument', () => {
    it('returns true for owner', () => {
      expect(canUpdateDocument(makeUser('editor', 'owner'), 'owner')).toBe(true)
    })

    it('returns true for admin', () => {
      expect(canUpdateDocument(makeUser('admin'), 'other')).toBe(true)
    })

    it('returns false for non-owner viewer', () => {
      expect(canUpdateDocument(makeUser('viewer'), 'other')).toBe(false)
    })
  })

  describe('canDeleteDocument', () => {
    it('returns true for owner', () => {
      expect(canDeleteDocument(makeUser('editor', 'owner'), 'owner')).toBe(true)
    })

    it('returns false for non-owner', () => {
      expect(canDeleteDocument(makeUser('editor'), 'other')).toBe(false)
    })
  })

  describe('canShareDocument', () => {
    it('returns true for admin', () => {
      expect(canShareDocument(makeUser('admin'))).toBe(true)
    })

    it('returns false for viewer', () => {
      expect(canShareDocument(makeUser('viewer'))).toBe(false)
    })
  })

  describe('canPublishDocument', () => {
    it('returns true for admin', () => {
      expect(canPublishDocument(makeUser('admin'))).toBe(true)
    })

    it('returns false for editor', () => {
      expect(canPublishDocument(makeUser('editor'))).toBe(false)
    })
  })

  describe('canExportDocument', () => {
    it('returns true for admin and editor', () => {
      expect(canExportDocument(makeUser('admin'))).toBe(true)
      expect(canExportDocument(makeUser('editor'))).toBe(true)
    })

    it('returns false for viewer', () => {
      expect(canExportDocument(makeUser('viewer'))).toBe(false)
    })
  })

  describe('canManageUsers', () => {
    it('returns true for admin only', () => {
      expect(canManageUsers(makeUser('admin'))).toBe(true)
      expect(canManageUsers(makeUser('editor'))).toBe(false)
    })
  })

  describe('canManageTemplates', () => {
    it('returns true for admin only', () => {
      expect(canManageTemplates(makeUser('admin'))).toBe(true)
      expect(canManageTemplates(makeUser('editor'))).toBe(false)
    })
  })

  describe('getRoleLevel', () => {
    it('returns correct levels', () => {
      expect(getRoleLevel('admin')).toBe(3)
      expect(getRoleLevel('editor')).toBe(2)
      expect(getRoleLevel('viewer')).toBe(1)
    })
  })

  describe('hasHigherRole', () => {
    it('detects higher role', () => {
      expect(hasHigherRole('admin', 'editor')).toBe(true)
      expect(hasHigherRole('editor', 'viewer')).toBe(true)
      expect(hasHigherRole('viewer', 'admin')).toBe(false)
    })
  })

  describe('getPermissionsForRole', () => {
    it('returns permissions for role', () => {
      const perms = getPermissionsForRole('admin')
      expect(perms).toContain('document:create')
      expect(perms).toContain('user:manage')
    })

    it('returns empty for unknown role', () => {
      const perms = getPermissionsForRole('viewer' as never)
      expect(perms.length).toBeGreaterThan(0)
    })
  })

  describe('getAllRoles', () => {
    it('returns all roles', () => {
      const roles = getAllRoles()
      expect(roles).toContain('admin')
      expect(roles).toContain('editor')
      expect(roles).toContain('viewer')
    })
  })

  describe('isValidRole', () => {
    it('validates correct roles', () => {
      expect(isValidRole('admin')).toBe(true)
      expect(isValidRole('editor')).toBe(true)
      expect(isValidRole('viewer')).toBe(true)
    })

    it('rejects invalid roles', () => {
      expect(isValidRole('superadmin')).toBe(false)
      expect(isValidRole('')).toBe(false)
    })
  })

  describe('isOwner', () => {
    it('returns true when user is owner', () => {
      expect(isOwner(makeUser('editor', 'owner'), 'owner')).toBe(true)
    })

    it('returns false when user is not owner', () => {
      expect(isOwner(makeUser('editor', 'user-1'), 'owner')).toBe(false)
    })
  })

  describe('canEdit', () => {
    it('allows admin to edit', () => {
      expect(canEdit(makeUser('admin'), 'other').allowed).toBe(true)
    })

    it('allows owner to edit', () => {
      expect(canEdit(makeUser('editor', 'owner'), 'owner').allowed).toBe(true)
    })

    it('allows editor to edit', () => {
      expect(canEdit(makeUser('editor'), 'other').allowed).toBe(true)
    })

    it('denies viewer to edit', () => {
      expect(canEdit(makeUser('viewer'), 'other').allowed).toBe(false)
    })
  })

  describe('canComment', () => {
    it('allows all roles to comment', () => {
      expect(canComment(makeUser('admin')).allowed).toBe(true)
      expect(canComment(makeUser('editor')).allowed).toBe(true)
      expect(canComment(makeUser('viewer')).allowed).toBe(true)
    })
  })

  describe('canResolveComments', () => {
    it('allows admin only', () => {
      expect(canResolveComments(makeUser('admin')).allowed).toBe(true)
      expect(canResolveComments(makeUser('editor')).allowed).toBe(false)
    })
  })
})
