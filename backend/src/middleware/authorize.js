const { HttpError } = require('../utils/httpError');

/**
 * Role-based access control middleware. Must be used AFTER authMiddleware.
 *
 * Accepts a mix of:
 *  - identities:  'admin' | 'staff' | 'student' | 'parent' | 'principal' | 'management'
 *  - staff roles: 'teacher' | 'accountant' | 'librarian' | 'clerk' | 'receptionist' |
 *                 'nurse' | 'counselor' | 'coordinator' | 'lab_assistant' | 'peon' |
 *                 'driver' | 'security' | 'other'
 *
 * A request passes if EITHER:
 *   - req.user.identity is in the allowed list, OR
 *   - req.user.identity === 'staff' AND req.user.staffRole is in the allowed list
 *
 * Examples:
 *   authorize('admin', 'management', 'principal')                 // top-level only
 *   authorize('admin', 'management', 'principal', 'accountant')   // + accountants
 */
module.exports = (...allowed) => {
  return (req, _res, next) => {
    const user = req.user;

    if (!user || !user.identity) {
      return next(new HttpError(403, 'Forbidden: Unknown identity', { code: 'FORBIDDEN' }));
    }

    const identityAllowed = allowed.includes(user.identity);
    const staffRoleAllowed =
      user.identity === 'staff' && !!user.staffRole && allowed.includes(user.staffRole);

    if (!identityAllowed && !staffRoleAllowed) {
      return next(
        new HttpError(403, 'Forbidden: You do not have permission to perform this action', {
          code: 'FORBIDDEN_IDENTITY',
        })
      );
    }

    next();
  };
};
