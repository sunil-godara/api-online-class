const db = require('../models');
const User = db.User;

// Helper function to determine user type
const getUserType = user => {
  if (user.is_admin) return 'admin';
  if (user.is_practitioner) return 'practitioner';
  return 'user';
};

// Middleware to check if user has required role
const requireRole = allowedRoles => {
  return async (ctx, next) => {
    try {
      const { id } = ctx.customData;

      const user = await User.findOne({ where: { id } });

      if (!user) {
        ctx.status = 401;
        ctx.body = {
          message: 'User not found',
          status: false,
          data: null
        };
        return;
      }

      const userType = getUserType(user);

      // Convert single role to array for consistent handling
      const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!roles.includes(userType)) {
        ctx.status = 403;
        ctx.body = {
          message: `Access denied. Required role: ${roles.join(' or ')}`,
          status: false,
          data: null
        };
        return;
      }

      // Add user type to context for use in controllers
      ctx.userType = userType;
      ctx.user = user;

      return next();
    } catch (error) {
      console.error('Role verification error:', error);
      ctx.status = 500;
      ctx.body = {
        message: 'Internal server error during role verification',
        status: false,
        data: null
      };
    }
  };
};

// Specific role middlewares
const requireAdmin = requireRole('admin');
const requirePractitioner = requireRole('practitioner');
const requireUser = requireRole('user');

// Middleware for admin or practitioner access
const requireAdminOrPractitioner = requireRole(['admin', 'practitioner']);

// Middleware for any authenticated user
const requireAnyUser = requireRole(['admin', 'practitioner', 'user']);

module.exports = {
  requireRole,
  requireAdmin,
  requirePractitioner,
  requireUser,
  requireAdminOrPractitioner,
  requireAnyUser,
  getUserType
};
