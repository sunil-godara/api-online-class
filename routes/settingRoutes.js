const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdmin } = require('../middlewares/roleMiddleware');
const {
  addSetting,
  editSetting,
  deleteSetting,
  getSettingDetail,
  listSettings,
  getSettingBySlug,
  updateSettingValue
} = require('../controllers/settingController');

const router = new Router();

// Admin routes (require authentication and admin role)
router.post('/setting/create', verifyToken, requireAdmin, addSetting);
router.post('/setting/edit', verifyToken, requireAdmin, editSetting);
router.post('/setting/delete', verifyToken, requireAdmin, deleteSetting);
router.post('/setting/detail', verifyToken, requireAdmin, getSettingDetail);
router.get('/setting/list', verifyToken, requireAdmin, listSettings);
router.post('/setting/update-value', verifyToken, requireAdmin, updateSettingValue);

// Public route (no authentication required)
router.get('/setting/public/:slug', getSettingBySlug);

module.exports = router;
