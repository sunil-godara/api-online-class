const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireAdminOrPractitioner, requireAnyUser } = require('../middlewares/roleMiddleware');

const {
  createStudioRoom,
  listStudioRooms,
  getStudioRoomDetail,
  editStudioRoom,
  deleteStudioRoom
} = require('../controllers/studioRoomController');

const router = new Router();

// Studio room routes
// Create studio room (Practitioner only, in their own approved studio)
router.post('/studio-room/create', verifyToken, requireAdminOrPractitioner, createStudioRoom);

// List studio rooms (Practitioner: own studio rooms, Admin: all studio rooms)
router.get('/studio-room', verifyToken, requireAnyUser, listStudioRooms);

// Get studio room detail (Practitioner: own studio room, Admin: any studio room)
router.post('/studio-room/detail', verifyToken, requireAnyUser, getStudioRoomDetail);

// Edit studio room (Practitioner only, only their own)
router.post('/studio-room/edit', verifyToken, requireAdminOrPractitioner, editStudioRoom);

// Delete studio room (Practitioner only, only their own)
router.post('/studio-room/delete', verifyToken, requireAdminOrPractitioner, deleteStudioRoom);

module.exports = router;
