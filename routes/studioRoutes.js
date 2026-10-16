const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdmin, requireAdminOrPractitioner, requireAnyUser } = require('../middlewares/roleMiddleware');

const {
  createStudio,
  editStudio,
  getStudioDetail,
  deleteStudio,
  listStudios,
  updateStudioApproval
} = require('../controllers/studioController');

const router = new Router();

// Studio routes
// Create studio (Practitioner only)
router.post('/studio/create', verifyToken, requireAdminOrPractitioner, createStudio);

// List studios (Practitioner: own studio, Admin: all studios)
router.get('/studio', verifyToken, requireAnyUser, listStudios);

// View studio details (Practitioner: own studio, Admin: any studio) - converted to POST
router.post('/studio/detail', verifyToken, requireAnyUser, getStudioDetail);

// Edit studio (Practitioner only, only their own) - converted to POST
router.post('/studio/edit', verifyToken, requireAdminOrPractitioner, editStudio);

// Delete studio (Practitioner only, only their own) - converted to POST
router.post('/studio/delete', verifyToken, requireAdminOrPractitioner, deleteStudio);

// Update studio approval status (Admin only) - handles both approve and reject
router.post('/studio/approval', verifyToken, requireAdmin, updateStudioApproval);

module.exports = router;
