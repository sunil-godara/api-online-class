const Router = require('koa-router');
const { stripeWebhookHandler } = require('../controllers/stripeController');

const router = new Router();

router.post('/stripe/webhook', stripeWebhookHandler);

module.exports = router;
