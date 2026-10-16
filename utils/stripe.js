const db = require('../models');
const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-08-16'
});

const getOrCreateCustomerId = async userId => {
  const user = await db.User.findOne({ where: { id: userId } });

  if (!user) {
    return {
      status: false,
      message: 'User not found',
      data: {}
    };
  }

  if (user.stripeCustomerId) {
    return {
      status: true,
      message: 'Customer already exists',
      data: { stripeCustomerId: user.stripeCustomerId }
    };
  }

  const customers = await stripe.customers.list({ email: user.email, limit: 1 });

  let customerId;
  if (customers.data.length > 0) {
    customerId = customers.data[0].id;
  } else {
    const customer = await stripe.customers.create({
      email: user.email,
      metadata: { userId: user.id }
    });
    customerId = customer.id;
  }

  await db.PractitionerProfile.update({ stripeCustomerId: customerId }, { where: { userId } });

  return {
    status: true,
    message: 'Customer created',
    data: { stripeCustomerId: customerId }
  };
};

const createCheckoutSession = async payload => {
  const { bookingId, classId, userId } = payload;
  console.log('🚀 ~ createCheckoutSession ~  bookingId, classId, userId:', { bookingId, classId, userId });
  const paymentMethod = 'card';
  const clientUrl = process.env.USER_APP_URL;

  const customerResult = await getOrCreateCustomerId(userId);
  if (!customerResult.status) {
    return customerResult;
  }

  const stripeCustomerId = customerResult.data.stripeCustomerId;

  const classDetails = await db.Class.findOne({
    where: { id: classId, approvalStatus: 'approved' }
  });

  if (!classDetails) {
    return { status: false, message: 'Class not found', data: {} };
  }

  const existingPayment = await db.Payment.findOne({
    where: { bookingId }
  });

  if (existingPayment) {
    return { status: false, message: 'Payment already exists for this booking', data: {} };
  }

  const payment = await db.Payment.create({
    status: 'Pending',
    bookingId,
    amount: classDetails.price,
    payoutStatus: 'Pending'
  });

  const session = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    payment_method_types: [paymentMethod],
    mode: 'payment',
    line_items: [
      {
        price: classDetails.price,
        quantity: 1
      }
    ],
    success_url: `${clientUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${clientUrl}/payment-failed`,
    metadata: {
      internalPaymentId: payment.id,
      userId,
      bookingId,
      classId
    }
  });

  await db.Payment.update(
    {
      status: 'InProgress',
      paymentId: session.id
    },
    { where: { id: payment.id } }
  );

  return session;
};

module.exports = {
  stripe,
  getOrCreateCustomerId,
  createCheckoutSession
};
