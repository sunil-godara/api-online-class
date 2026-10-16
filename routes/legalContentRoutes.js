const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const {
  addLegalContent,
  editLegalContent,
  deleteLegalContent,
  getLegalContentDetail,
  listLegalContent,
  updateLegalContentStatus,
  updateLegalContentPublish,
  getLegalContentBySlug
} = require('../controllers/legalContentController');

const router = new Router();

// Admin routes (require authentication and admin role)
router.post('/legal-content/create', verifyToken, requireAdmin, addLegalContent);
router.post('/legal-content/edit', verifyToken, requireAdmin, editLegalContent);
router.post('/legal-content/delete', verifyToken, requireAdmin, deleteLegalContent);
router.post('/legal-content/detail', verifyToken, requireAdmin, getLegalContentDetail);
router.get('/legal-content/list', verifyToken, requireAdmin, listLegalContent);
router.post('/legal-content/status', verifyToken, requireAdmin, updateLegalContentStatus);
router.post('/legal-content/publish', verifyToken, requireAdmin, updateLegalContentPublish);

// Public route (no authentication required)
router.get('/legal-content/public/:slug', getLegalContentBySlug);

module.exports = router;
