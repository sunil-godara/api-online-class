const Router = require('koa-router');
const userRoutes = require('./userRoutes');
const authRoutes = require('./authRoutes');
const studioRoutes = require('./studioRoutes');
const classRoutes = require('./classRoutes');
const studioRoomRoutes = require('./studioRoomRoutes');
const modalityRoutes = require('./modalityRoutes');
const legalContentRoutes = require('./legalContentRoutes');
const settingRoutes = require('./settingRoutes');
const journalRoutes = require('./journalRoutes');

const router = new Router();

// Routes
router.get('/test', ctx => {
  ctx.body = 'Hello World';
});

// API routes
router.use('/api', userRoutes.routes(), userRoutes.allowedMethods());
router.use('/api', authRoutes.routes(), authRoutes.allowedMethods());
router.use('/api', studioRoutes.routes(), studioRoutes.allowedMethods());
router.use('/api', classRoutes.routes(), classRoutes.allowedMethods());
router.use('/api', studioRoomRoutes.routes(), studioRoomRoutes.allowedMethods());
router.use('/api', modalityRoutes.routes(), modalityRoutes.allowedMethods());
router.use('/api', legalContentRoutes.routes(), legalContentRoutes.allowedMethods());
router.use('/api', settingRoutes.routes(), settingRoutes.allowedMethods());
router.use('/api', journalRoutes.routes(), journalRoutes.allowedMethods());

module.exports = router;
