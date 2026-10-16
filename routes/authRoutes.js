const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  requireAdmin,
  requirePractitioner,
  requireUser,
  requireAdminOrPractitioner,
  requireAnyUser
} = require('../middlewares/roleMiddleware');

const {
  register,
  login,
  forgotPassword,
  resendForgotPasswordEmail,
  verifyResetToken,
  resetPassword,
  verifyUserAuth,
  logout,
  changePassword,
  verifyEmail,
  verifyPhone,
  resendEmailVerification,
  resendPhoneVerification
} = require('../controllers/authController');

const router = new Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/resend-forgot-password', resendForgotPasswordEmail);
router.post('/verify-reset-token', verifyResetToken);
router.post('/reset-password', resetPassword);
router.post('/verify-email', verifyEmail);
router.post('/verify-phone', verifyPhone);
router.post('/resend-email-verification', resendEmailVerification);
router.post('/resend-phone-verification', resendPhoneVerification);

// Protected routes
router.get('/auth/me', verifyToken, verifyUserAuth);
router.get('/auth/logout', verifyToken, logout);
router.post('/auth/change-password', verifyToken, changePassword);

// Role-based routes examples
router.get('/admin/dashboard', verifyToken, requireAdmin, async ctx => {
  ctx.status = 200;
  ctx.body = {
    message: 'Admin dashboard accessed successfully',
    status: true,
    data: { user_type: ctx.userType, user_id: ctx.customData.id }
  };
});

router.get('/practitioner/dashboard', verifyToken, requirePractitioner, async ctx => {
  ctx.status = 200;
  ctx.body = {
    message: 'Practitioner dashboard accessed successfully',
    status: true,
    data: { user_type: ctx.userType, user_id: ctx.customData.id }
  };
});

router.get('/user/dashboard', verifyToken, requireUser, async ctx => {
  ctx.status = 200;
  ctx.body = {
    message: 'User dashboard accessed successfully',
    status: true,
    data: { user_type: ctx.userType, user_id: ctx.customData.id }
  };
});

router.get('/staff/dashboard', verifyToken, requireAdminOrPractitioner, async ctx => {
  ctx.status = 200;
  ctx.body = {
    message: 'Staff dashboard accessed successfully',
    status: true,
    data: { user_type: ctx.userType, user_id: ctx.customData.id }
  };
});

router.get('/profile', verifyToken, requireAnyUser, async ctx => {
  ctx.status = 200;
  ctx.body = {
    message: 'Profile accessed successfully',
    status: true,
    data: { user_type: ctx.userType, user_id: ctx.customData.id }
  };
});

module.exports = router;
