const { stripe } = require('../utils/stripe');

exports.stripeWebhookHandler = async ctx => {
  const sig = ctx.request.headers['stripe-signature'];
  const rawBody = ctx.req.rawBody;

  let event;
  console.log('🚀 ~ event:', event);
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('❌ Webhook signature verification failed:', err.message);
    ctx.status = 400;
    ctx.body = `Webhook Error: ${err.message}`;
    return;
  }
  console.log('🚀 ~ event:', event);

  // Handle event types
  //   switch (event.type) {
  //     case 'checkout.session.completed':
  //       const session = event.data.object;
  //       console.log('✅ Checkout completed:', session.id);
  //       // Update DB logic here
  //       break;

  //     default:
  //       console.log(`ℹ️ Unhandled event type: ${event.type}`);
  //   }

  ctx.status = 200;
  ctx.body = { received: true };
};
