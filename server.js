require('dotenv').config();
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const cors = require('@koa/cors');
const Router = require('koa-router');
const getRawBody = require('raw-body');

// Route modules
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const studioRoutes = require('./routes/studioRoutes');
const studioRoomRoutes = require('./routes/studioRoomRoutes');
const classRoutes = require('./routes/classRoutes');
const modalityRoutes = require('./routes/modalityRoutes');
const legalContentRoutes = require('./routes/legalContentRoutes');
const settingRoutes = require('./routes/settingRoutes');
const journalRoutes = require('./routes/journalRoutes');
const bookClassRoutes = require('./routes/bookClassRoutes');
const stripeRoutes = require('./routes/stripeRoutes');

const app = new Koa();
const router = new Router();

// 🌐 Enable CORS
app.use(cors());

// 🧾 Capture raw body for Stripe webhook
app.use(async (ctx, next) => {
  if (ctx.url === '/stripe/webhook' && ctx.method === 'POST') {
    ctx.req.rawBody = await getRawBody(ctx.req, {
      length: ctx.request.length,
      limit: '1mb',
      encoding: ctx.request.charset || 'utf-8'
    });
  }
  await next();
});

// 📦 Parse JSON bodies
app.use(bodyParser());

// 🪵 Request/Response Logger
app.use(async (ctx, next) => {
  const start = Date.now();

  console.log('🪵 Request:', {
    method: ctx.method,
    url: ctx.url,
    body: ctx.request.body
  });

  await next();

  const ms = Date.now() - start;
  console.log(`📥 ${ctx.method} ${ctx.url} → ${ctx.status} [${ms}ms]`);

  if (typeof ctx.body === 'string' || typeof ctx.body === 'object' || Buffer.isBuffer(ctx.body)) {
    console.log('📤 Response body:', ctx.body);
  } else {
    console.log('📤 Response body: [stream or unsupported type]');
  }
});

// 🧪 Test route
router.get('/test', ctx => {
  ctx.body = 'Hello World';
});
app.use(router.routes()).use(router.allowedMethods());

// 🚪 Register route handlers
app.use(authRoutes.routes()).use(authRoutes.allowedMethods());
app.use(userRoutes.routes()).use(userRoutes.allowedMethods());
app.use(studioRoutes.routes()).use(studioRoutes.allowedMethods());
app.use(studioRoomRoutes.routes()).use(studioRoomRoutes.allowedMethods());
app.use(classRoutes.routes()).use(classRoutes.allowedMethods());
app.use(modalityRoutes.routes()).use(modalityRoutes.allowedMethods());
app.use(legalContentRoutes.routes()).use(legalContentRoutes.allowedMethods());
app.use(settingRoutes.routes()).use(settingRoutes.allowedMethods());
app.use(journalRoutes.routes()).use(journalRoutes.allowedMethods());
app.use(bookClassRoutes.routes()).use(bookClassRoutes.allowedMethods());
app.use(stripeRoutes.routes()).use(stripeRoutes.allowedMethods());

// 🚀 Start the server
const PORT = process.env.PORT || 3002;
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
});
