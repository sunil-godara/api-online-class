const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdmin, requireAdminOrPractitioner, requireAnyUser } = require('../middlewares/roleMiddleware');

const {
  createClass,
  listClasses,
  getClassDetail,
  editClass,
  deleteClass,
  updateClassApproval,
  classListing,
  recommendedClasses,
  upcomingClasses,
  getClassByModality
} = require('../controllers/classController');

const router = new Router();

// Class routes
// Create class (Practitioner only)
router.post('/class/create', verifyToken, requireAdminOrPractitioner, createClass);

// List classes (Practitioner: own classes, Admin: all classes)
router.get('/class', verifyToken, requireAnyUser, listClasses);

// Get class detail (Practitioner: own class, Admin: any class)
router.post('/class/detail', verifyToken, requireAnyUser, getClassDetail);

// Edit class (Practitioner only, only their own)
router.post('/class/edit', verifyToken, requireAdminOrPractitioner, editClass);

// Delete class (Practitioner only, only their own)
router.post('/class/delete', verifyToken, requireAdminOrPractitioner, deleteClass);

// Update class approval status (Admin only)
router.post('/class/approval', verifyToken, requireAdmin, updateClassApproval);

// Class Listing for End User
router.get('/class/listing', verifyToken, requireAnyUser, classListing);

// Recommended classes for End User
router.get('/class/recommended', verifyToken, requireAnyUser, recommendedClasses);

// Upcoming classes for End User
router.get('/class/upcoming', verifyToken, requireAnyUser, upcomingClasses);

// Get class on basis of modality
router.get('/class/modality/:id', verifyToken, requireAnyUser, getClassByModality);

module.exports = router;
