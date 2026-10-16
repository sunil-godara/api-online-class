require('dotenv').config();
const db = require('../models');
const User = db.User;
const PractitionerProfile = db.PractitionerProfile;

// Get practitioners list (Admin and Practitioner access)
const getPractitionersList = async ctx => {
  try {
    const practitioners = await User.findAll({
      where: { is_practitioner: true },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: PractitionerProfile,
          as: 'practitionerProfile',
          attributes: [
            'id',
            'bio',
            'certifications',
            'stripeConnectId',
            'approvalStatus',
            'commissionRate',
            'createdAt',
            'updatedAt'
          ],
          required: true // This ensures only users with profiles are returned
        },
        {
          model: db.PractitionerModality,
          as: 'practitionerModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const practitionersWithType = practitioners.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        user_type: 'practitioner'
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Practitioners fetched successfully',
      status: true,
      data: practitionersWithType
    };
  } catch (err) {
    console.error('Error in getPractitionersList:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch practitioners',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Save practitioner profile (Admin and Practitioner access)
const savePractitionerProfile = async ctx => {
  try {
    const { userId, bio, certifications, stripeConnectId, commissionRate, modalityIds } = ctx.request.body;

    // Validate required fields
    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        message: 'User ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Check if user exists and is a practitioner
    const user = await User.findByPk(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    if (!user.is_practitioner) {
      ctx.status = 400;
      ctx.body = {
        message: 'User must be a practitioner to save profile',
        status: false,
        data: null
      };
      return;
    }

    // Validate commission rate if provided
    if (commissionRate !== undefined && commissionRate !== null) {
      if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
        ctx.status = 400;
        ctx.body = {
          message: 'Commission rate must be a number between 0 and 100',
          status: false,
          data: null
        };
        return;
      }
    }

    // Validate modalityIds if provided
    if (modalityIds && Array.isArray(modalityIds)) {
      // Check if all modalityIds exist in the modalities table
      const modalities = await db.Modality.findAll({
        where: { id: modalityIds }
      });

      if (modalities.length !== modalityIds.length) {
        ctx.status = 400;
        ctx.body = {
          message: 'One or more modality IDs are invalid',
          status: false,
          data: null
        };
        return;
      }
    }

    // Check if profile already exists
    let profile = await PractitionerProfile.findOne({
      where: { userId: userId }
    });

    if (profile) {
      // Update existing profile
      await profile.update({
        bio,
        certifications,
        stripeConnectId,
        commissionRate
      });
    } else {
      // Create new profile
      profile = await PractitionerProfile.create({
        userId,
        bio,
        certifications,
        stripeConnectId,
        commissionRate,
        approvalStatus: 'pending'
      });
    }

    // Handle modalityIds - delete existing and create new ones
    if (modalityIds && Array.isArray(modalityIds)) {
      // Delete existing practitioner modalities
      await db.PractitionerModality.destroy({
        where: { practitionerId: userId }
      });

      // Create new practitioner modalities
      const practitionerModalities = modalityIds.map(modalityId => ({
        practitionerId: userId,
        modalityId: modalityId
      }));

      await db.PractitionerModality.bulkCreate(practitionerModalities);
    }

    // Fetch updated profile with user details and modalities
    const updatedProfile = await PractitionerProfile.findOne({
      where: { userId: userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        }
      ]
    });

    // Fetch practitioner modalities
    const practitionerModalities = await db.PractitionerModality.findAll({
      where: { practitionerId: userId },
      include: [
        {
          model: db.Modality,
          as: 'modality',
          attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
        }
      ]
    });

    const responseData = {
      ...updatedProfile.toJSON(),
      modalities: practitionerModalities.map(pm => pm.modality)
    };

    ctx.status = 200;
    ctx.body = {
      message: profile ? 'Practitioner profile updated successfully' : 'Practitioner profile created successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in savePractitionerProfile:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to save practitioner profile',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Approve practitioner profile (Admin only)
const approvePractitionerProfile = async ctx => {
  try {
    const { profileId, approvalStatus } = ctx.request.body;

    // Validate required fields
    if (!profileId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Profile ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!approvalStatus) {
      ctx.status = 400;
      ctx.body = {
        message: 'Approval status is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate approval status values
    const validStatuses = ['pending', 'approved', 'rejected'];
    if (!validStatuses.includes(approvalStatus)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid approval status. Must be pending, approved, or rejected',
        status: false,
        data: null
      };
      return;
    }

    // Find the practitioner profile
    const profile = await PractitionerProfile.findByPk(profileId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        }
      ]
    });

    if (!profile) {
      ctx.status = 404;
      ctx.body = {
        message: 'Practitioner profile not found',
        status: false,
        data: null
      };
      return;
    }

    // Update the approval status
    await profile.update({
      approvalStatus: approvalStatus
    });

    // Fetch updated profile
    const updatedProfile = await PractitionerProfile.findByPk(profileId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        }
      ]
    });

    // Fetch practitioner modalities
    const practitionerModalities = await db.PractitionerModality.findAll({
      where: { practitionerId: updatedProfile.userId },
      include: [
        {
          model: db.Modality,
          as: 'modality',
          attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
        }
      ]
    });

    const responseData = {
      ...updatedProfile.toJSON(),
      modalities: practitionerModalities.map(pm => pm.modality)
    };

    ctx.status = 200;
    ctx.body = {
      message: `Practitioner profile ${approvalStatus} successfully`,
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in approvePractitionerProfile:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update practitioner profile approval status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update practitioner commission rate (Admin only)
const updatePractitionerCommission = async ctx => {
  try {
    const { profileId, commissionRate } = ctx.request.body;

    // Validate required fields
    if (!profileId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Profile ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (commissionRate === undefined || commissionRate === null) {
      ctx.status = 400;
      ctx.body = {
        message: 'Commission rate is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate commission rate
    if (isNaN(commissionRate) || commissionRate < 0 || commissionRate > 100) {
      ctx.status = 400;
      ctx.body = {
        message: 'Commission rate must be a number between 0 and 100',
        status: false,
        data: null
      };
      return;
    }

    // Find the practitioner profile
    const profile = await PractitionerProfile.findByPk(profileId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        }
      ]
    });

    if (!profile) {
      ctx.status = 404;
      ctx.body = {
        message: 'Practitioner profile not found',
        status: false,
        data: null
      };
      return;
    }

    // Update the commission rate
    await profile.update({
      commissionRate: commissionRate
    });

    // Fetch updated profile
    const updatedProfile = await PractitionerProfile.findByPk(profileId, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone', 'status']
        }
      ]
    });

    // Fetch practitioner modalities
    const practitionerModalities = await db.PractitionerModality.findAll({
      where: { practitionerId: updatedProfile.userId },
      include: [
        {
          model: db.Modality,
          as: 'modality',
          attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
        }
      ]
    });

    const responseData = {
      ...updatedProfile.toJSON(),
      modalities: practitionerModalities.map(pm => pm.modality)
    };

    ctx.status = 200;
    ctx.body = {
      message: 'Commission rate updated successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in updatePractitionerCommission:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update practitioner commission rate',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete practitioner (Admin only)
const deletePractitioner = async ctx => {
  try {
    const { userId } = ctx.request.body;

    // Validate required fields
    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        message: 'User ID is required',
        status: false,
        data: null
      };
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    if (!user.is_practitioner) {
      ctx.status = 400;
      ctx.body = {
        message: 'User must be a practitioner to delete',
        status: false,
        data: null
      };
      return;
    }

    // Delete the practitioner profile first (if exists)
    await PractitionerProfile.destroy({
      where: { userId: userId }
    });

    // Delete practitioner modalities
    await db.PractitionerModality.destroy({
      where: { practitionerId: userId }
    });

    // Delete the user (soft delete since paranoid: true)
    await user.destroy();

    // Fetch all practitioners list after successful deletion (like getPractitionersList)
    const practitioners = await User.findAll({
      where: { is_practitioner: true },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: PractitionerProfile,
          as: 'practitionerProfile',
          attributes: [
            'id',
            'bio',
            'certifications',
            'stripeConnectId',
            'approvalStatus',
            'commissionRate',
            'createdAt',
            'updatedAt'
          ],
          required: true // This ensures only users with profiles are returned
        },
        {
          model: db.PractitionerModality,
          as: 'practitionerModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const practitionersWithType = practitioners.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        user_type: 'practitioner'
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Practitioner deleted successfully',
      status: true,
      data: practitionersWithType
    };
  } catch (err) {
    console.error('Error in deletePractitioner:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete practitioner',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update practitioner status and reason (Admin only)
const updatePractitionerStatus = async ctx => {
  try {
    const { userId, status, reason } = ctx.request.body;

    // Validate required fields
    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        message: 'User ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!status) {
      ctx.status = 400;
      ctx.body = {
        message: 'Status is required',
        status: false,
        data: null
      };
      return;
    }

    if (!reason) {
      ctx.status = 400;
      ctx.body = {
        message: 'Reason is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate status values
    const validStatuses = ['0', '1'];
    if (!validStatuses.includes(status)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid status. Must be "0" (inactive) or "1" (active)',
        status: false,
        data: null
      };
      return;
    }

    // Validate reason length
    if (typeof reason !== 'string' || reason.length > 255) {
      ctx.status = 400;
      ctx.body = {
        message: 'Reason must be a string with maximum 255 characters',
        status: false,
        data: null
      };
      return;
    }

    const user = await User.findByPk(userId);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    if (!user.is_practitioner) {
      ctx.status = 400;
      ctx.body = {
        message: 'User must be a practitioner to update status',
        status: false,
        data: null
      };
      return;
    }

    // Update user status and reason
    await user.update({
      status,
      reason
    });

    // Fetch all practitioners list after successful update (like getPractitionersList)
    const practitioners = await User.findAll({
      where: { is_practitioner: true },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'reason', 'createdAt', 'updatedAt'],
      include: [
        {
          model: PractitionerProfile,
          as: 'practitionerProfile',
          attributes: [
            'id',
            'bio',
            'certifications',
            'stripeConnectId',
            'approvalStatus',
            'commissionRate',
            'createdAt',
            'updatedAt'
          ],
          required: true // This ensures only users with profiles are returned
        },
        {
          model: db.PractitionerModality,
          as: 'practitionerModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const practitionersWithType = practitioners.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        user_type: 'practitioner'
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: `Practitioner status updated to ${status === '1' ? 'active' : 'inactive'} successfully`,
      status: true,
      data: practitionersWithType
    };
  } catch (err) {
    console.error('Error in updatePractitionerStatus:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update practitioner status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get practitioner detail with profile and bookings (Admin and Practitioner access)
const getPractitionerDetail = async ctx => {
  try {
    console.log('Here');
    const { userId } = ctx.request.body;

    // Validate required fields
    if (!userId) {
      ctx.status = 400;
      ctx.body = {
        message: 'User ID is required',
        status: false,
        data: null
      };
      return;
    }

    // First get user without associations to check if user exists and is practitioner
    const user = await User.findByPk(userId, {
      attributes: ['id', 'name', 'email', 'phone', 'status', 'reason', 'createdAt', 'updatedAt']
    });

    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    // Get practitioner profile
    const profile = await PractitionerProfile.findOne({
      where: { userId: userId }
    });

    // Get practitioner modalities
    const practitionerModalities = await db.PractitionerModality.findAll({
      where: { practitionerId: userId },
      include: [
        {
          model: db.Modality,
          as: 'modality',
          attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
        }
      ]
    });

    // Get studios associated with the practitioner through createdBy column
    const studios = await db.Studio.findAll({
      where: { createdBy: userId },
      attributes: ['id', 'name', 'location', 'description', 'logoUrl']
    });

    // Get practitioner's classes (as instructor)
    const classes = await db.Class.findAll({
      where: { practitionerId: userId },
      attributes: [
        'id',
        'title',
        'description',
        'location',
        'dateTime',
        'durationMins',
        'price',
        'approvalStatus',
        'createdAt'
      ],
      include: [
        {
          model: db.Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location']
        },
        {
          model: db.StudioRoom,
          as: 'room',
          attributes: ['id', 'name']
        },
        {
          model: db.ClassModality,
          as: 'classModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform classes to include modalities in a cleaner format
    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData
      };
    });

    // Get practitioner's bookings (as instructor)
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.Class,
          as: 'class',
          where: { practitionerId: userId },
          attributes: ['id', 'title', 'description', 'location', 'dateTime', 'durationMins', 'price', 'approvalStatus'],
          include: [
            {
              model: db.User,
              as: 'practitioner',
              attributes: ['id', 'name', 'email']
            },
            {
              model: db.Studio,
              as: 'studio',
              attributes: ['id', 'name', 'location']
            },
            {
              model: db.ClassModality,
              as: 'classModalities',
              include: [
                {
                  model: db.Modality,
                  as: 'modality',
                  attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
                }
              ]
            }
          ]
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: db.Payment,
          as: 'payment',
          attributes: ['id', 'amount', 'status', 'stripeTxnId', 'payoutStatus', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform bookings to include modalities for classes in a cleaner format
    const bookingsWithModalities = bookings.map(booking => {
      const bookingData = booking.toJSON();
      if (bookingData.class) {
        bookingData.class.modalities = bookingData.class.classModalities
          ? bookingData.class.classModalities.map(cm => cm.modality)
          : [];
      }
      return bookingData;
    });

    const responseData = {
      ...user.toJSON(),
      user_type: 'practitioner',
      practitionerProfile: profile,
      modalities: practitionerModalities.map(pm => pm.modality),
      studios: studios,
      classes: classesWithModalities,
      bookings: bookingsWithModalities
    };

    ctx.status = 200;
    ctx.body = {
      message: 'Practitioner details fetched successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in getPractitionerDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch practitioner details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get practitioner detail with profile (End User access)
const getPractitionerDetailById = async ctx => {
  try {
    const practitionerId = ctx.params.practitionerId;

    // Get practitioner profile
    const profile = await PractitionerProfile.findOne({
      where: { userId: practitionerId }
    });

    // Get practitioner modalities
    const practitionerModalities = await db.PractitionerModality.findAll({
      where: { practitionerId: practitionerId },
      include: [
        {
          model: db.Modality,
          as: 'modality',
          attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
        }
      ]
    });

    // Get studios associated with the practitioner through createdBy column
    const studios = await db.Studio.findAll({
      where: { createdBy: practitionerId },
      attributes: ['id', 'name', 'location', 'description']
    });

    // Get practitioner's classes (as instructor)
    const classes = await db.Class.findAll({
      where: { practitionerId: practitionerId },
      attributes: [
        'id',
        'title',
        'description',
        'location',
        'dateTime',
        'durationMins',
        'price',
        'approvalStatus',
        'createdAt'
      ],
      include: [
        {
          model: db.Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location']
        },
        {
          model: db.StudioRoom,
          as: 'room',
          attributes: ['id', 'name']
        },
        {
          model: db.ClassModality,
          as: 'classModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform classes to include modalities in a cleaner format
    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData
      };
    });

    // Get practitioner's bookings (as instructor)
    const bookings = await db.Booking.findAll({
      include: [
        {
          model: db.Class,
          as: 'class',
          where: { practitionerId: practitionerId },
          attributes: ['id', 'title', 'description', 'location', 'dateTime', 'durationMins', 'price', 'approvalStatus'],
          include: [
            {
              model: db.User,
              as: 'practitioner',
              attributes: ['id', 'name', 'email']
            },
            {
              model: db.Studio,
              as: 'studio',
              attributes: ['id', 'name', 'location']
            },
            {
              model: db.ClassModality,
              as: 'classModalities',
              include: [
                {
                  model: db.Modality,
                  as: 'modality',
                  attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
                }
              ]
            }
          ]
        },
        {
          model: db.User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    // Transform bookings to include modalities for classes in a cleaner format
    const bookingsWithModalities = bookings.map(booking => {
      const bookingData = booking.toJSON();
      if (bookingData.class) {
        bookingData.class.modalities = bookingData.class.classModalities
          ? bookingData.class.classModalities.map(cm => cm.modality)
          : [];
      }
      return bookingData;
    });

    const responseData = {
      user_type: 'practitioner',
      practitionerProfile: profile,
      modalities: practitionerModalities.map(pm => pm.modality),
      studios: studios,
      classes: classesWithModalities,
      bookings: bookingsWithModalities
    };

    ctx.status = 200;
    ctx.body = {
      message: 'Practitioner details fetched successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in getPractitionerDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch practitioner details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Practitioners Listing for End User
const practitionersListing = async ctx => {
  try {
    const practitioners = await User.findAll({
      where: { is_practitioner: true, status: '1' },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
      include: [
        {
          model: PractitionerProfile,
          as: 'practitionerProfile',
          where: { approvalStatus: 'approved' }, // Only show approved practitioners
          attributes: [
            'id',
            'bio',
            'certifications',
            'stripeConnectId',
            'approvalStatus',
            'commissionRate',
            'createdAt',
            'updatedAt'
          ],
          required: true // This ensures only users with profiles are returned
        },
        {
          model: db.PractitionerModality,
          as: 'practitionerModalities',
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const practitionersWithType = practitioners.map(user => {
      const userData = user.toJSON();
      return {
        ...userData,
        user_type: 'practitioner'
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Approved practitioners fetched successfully',
      status: true,
      data: practitionersWithType
    };
  } catch (err) {
    console.error('Error in practitionersListing:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch practitioners',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  getPractitionersList,
  savePractitionerProfile,
  approvePractitionerProfile,
  updatePractitionerCommission,
  deletePractitioner,
  updatePractitionerStatus,
  getPractitionerDetail,
  practitionersListing,
  getPractitionerDetailById
};
