require('dotenv').config();
// const { Op } = require('sequelize');
const db = require('../models');
const { createCheckoutSession } = require('../utils/stripe');

// Create class (Practitioner only)
const bookClass = async ctx => {
  try {
    const { classId, amountPaid, referralCodeUsed } = ctx.request.body;
    const { id: userId } = ctx.customData;

    // Validate required fields
    if (!classId || amountPaid == null) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class ID and amountPaid are required',
        status: false,
        data: null
      };
      return;
    }

    // Check if class exists
    const classToBook = await db.Class.findByPk(classId, {
      include: [{ model: db.ClassModality, as: 'classModalities' }]
    });

    if (!classToBook) {
      ctx.status = 404;
      ctx.body = {
        message: 'Class not found',
        status: false,
        data: null
      };
      return;
    }

    // Check approval status
    if (classToBook.approvalStatus !== 'approved') {
      ctx.status = 400;
      ctx.body = {
        message: 'Class is not available for booking',
        status: false,
        data: null
      };
      return;
    }

    // Validate amount
    if (Number(amountPaid) !== Number(classToBook.price)) {
      ctx.status = 400;
      ctx.body = {
        message: `Amount paid (${amountPaid}) does not match class price (${classToBook.price})`,
        status: false,
        data: null
      };
      return;
    }

    // Check for existing booking
    const existingBooking = await db.Booking.findOne({
      where: { classId, userId }
    });

    if (existingBooking) {
      ctx.status = 400;
      ctx.body = {
        message: 'You have already booked this class',
        status: false,
        data: null
      };
      return;
    }

    const data = {
      classId,
      userId,
      amountPaid,
      seatsBooked: 1
    };

    // Handle referral code usage
    if (referralCodeUsed) {
      data.referralCode = referralCodeUsed;
    }

    // Create booking
    const booking = await db.Booking.create(data);

    const stripeData = await createCheckoutSession({
      bookingId: booking.id,
      classId,
      userId
    });
    console.log('🚀 ~ bookClass ~ stripeData:', stripeData);

    if (stripeData.status === false) {
      ctx.status = 400;
      ctx.body = {
        message: 'Failed to create Stripe checkout session',
        status: false,
        data: null
      };
      return;
    }

    // Prepare response
    const responseData = {
      ...booking.toJSON()
    };

    ctx.status = 201;
    ctx.body = {
      message: 'Class booked successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in bookClass:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to book class',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

const getMyBookings = async ctx => {
  try {
    const { id: userId } = ctx.customData;
    const now = new Date();

    const bookings = await db.Booking.findAll({
      where: { userId },
      include: [
        {
          model: db.Class,
          as: 'class',
          required: true,
          where: {
            [db.Sequelize.Op.or]: [
              { dateTime: { [db.Sequelize.Op.gt]: now } }, // upcoming
              {
                dateTime: { [db.Sequelize.Op.lte]: now },
                endTime: { [db.Sequelize.Op.gte]: now } // ongoing
              }
            ]
          },
          include: [{ model: db.ClassModality, as: 'classModalities' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Active bookings fetched',
      status: true,
      data: bookings
    };
  } catch (err) {
    console.error('Error in getMyBookings:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch active bookings',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

const getPastBookings = async ctx => {
  try {
    const { id: userId } = ctx.customData;

    const bookings = await db.Booking.findAll({
      where: { userId },
      include: [
        {
          model: db.Class,
          as: 'class',
          where: {
            endTime: { [db.Sequelize.Op.lt]: new Date() }, // past
            approvalStatus: 'approved'
          },
          include: [{ model: db.ClassModality, as: 'classModalities' }]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Past bookings fetched successfully',
      status: true,
      data: bookings
    };
  } catch (err) {
    console.error('Error in getPastBookings:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch past bookings',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  bookClass,
  getMyBookings,
  getPastBookings
};
