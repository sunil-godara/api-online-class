const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdmin, requireAnyUser } = require('../middlewares/roleMiddleware');

const {
  createModality,
  listModalities,
  getModalityDetail,
  editModality,
  deleteModality,
  updateModalityStatus
} = require('../controllers/modalityController');

const router = new Router();

// Modality routes
// Create modality (Admin only)
router.post('/modality/create', verifyToken, requireAdmin, createModality);

// List modalities (All users can view)
router.get('/modality', verifyToken, requireAnyUser, listModalities);

// Get modality detail (All users can view)
router.post('/modality/detail', verifyToken, requireAnyUser, getModalityDetail);

// Edit modality (Admin only)
router.post('/modality/edit', verifyToken, requireAdmin, editModality);

// Delete modality (Admin only)
router.post('/modality/delete', verifyToken, requireAdmin, deleteModality);

// Update modality status (Admin only)
router.post('/modality/status', verifyToken, requireAdmin, updateModalityStatus);

module.exports = router;
