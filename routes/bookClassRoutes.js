const Router = require('koa-router');
const { verifyToken } = require('../middlewares/authMiddleware');
const { requireUser } = require('../middlewares/roleMiddleware');
const { bookClass, getMyBookings, getPastBookings } = require('../controllers/bookClassController');

const router = new Router();

// Book Class Route only for end user
router.post('/book/class', verifyToken, requireUser, bookClass);

// My Book Class Route only for end user
router.get('/book/my-bookings', verifyToken, requireUser, getMyBookings);

// Past Book Class Route only for end user
router.get('/book/past-bookings', verifyToken, requireUser, getPastBookings);

module.exports = router;
