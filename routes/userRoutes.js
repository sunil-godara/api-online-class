const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  requireAdmin,
  requireAdminOrPractitioner,
  requireAnyUser,
  requireUser
} = require('../middlewares/roleMiddleware');

const {
  // getUserList,
  getEndUserList,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserDetail,
  getCurrentUserProfile,
  updateUserProfile,
  toggleAccountStatus
} = require('../controllers/userController');

const {
  getPractitionersList,
  savePractitionerProfile,
  approvePractitionerProfile,
  updatePractitionerCommission,
  deletePractitioner,
  updatePractitionerStatus,
  getPractitionerDetail,
  practitionersListing,
  getPractitionerDetailById
} = require('../controllers/practitionerController');

const router = new Router();

// Admin only routes
// router.get('/users', verifyToken, requireAdmin, getUserList);
router.get('/users', verifyToken, requireAdmin, getEndUserList);
router.put('/users/:userId/role', verifyToken, requireAdmin, updateUserRole);
router.post('/users/status', verifyToken, requireAdmin, updateUserStatus);
router.post('/users/delete', verifyToken, requireAdmin, deleteUser);
router.post('/users/detail', verifyToken, requireAdmin, getUserDetail);

// Admin and Practitioner routes
router.get('/practitioners', verifyToken, requireAdminOrPractitioner, getPractitionersList);
router.post('/practitioners/profile', verifyToken, requireAdminOrPractitioner, savePractitionerProfile);
router.post('/practitioners/detail', verifyToken, requireAdminOrPractitioner, getPractitionerDetail);

// Admin only practitioner routes
router.post('/practitioners/approve', verifyToken, requireAdmin, approvePractitionerProfile);
router.post('/practitioners/commission', verifyToken, requireAdmin, updatePractitionerCommission);
router.post('/practitioners/delete', verifyToken, requireAdmin, deletePractitioner);
router.post('/practitioners/status', verifyToken, requireAdmin, updatePractitionerStatus);

// Any authenticated user routes
router.get('/profile', verifyToken, requireAnyUser, getCurrentUserProfile);
router.post('/profile/update', verifyToken, requireAnyUser, updateUserProfile);
router.post('/account/toggle-status', verifyToken, requireAnyUser, toggleAccountStatus);

// Practitioners Listing for End User
router.get('/practitioners/listing', verifyToken, requireAnyUser, practitionersListing);

// Get practitioner by Id (For End User)
router.get('/practitioners/:practitionerId', verifyToken, requireUser, getPractitionerDetailById);

module.exports = router;
