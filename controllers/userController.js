require('dotenv').config();
const db = require('../models');
const User = db.User;
const { getUserType } = require('../utils/jwtHelper');

// Get user list (Admin only)
// const getUserList = async ctx => {
//   try {
//     const users = await User.findAll({
//       attributes: ['id', 'name', 'email', 'phone', 'is_admin', 'is_practitioner', 'status', 'createdAt', 'updatedAt'],
//       order: [['createdAt', 'DESC']]
//     });

//     // Add user_type to each user
//     const usersWithType = users.map(user => ({
//       ...user.toJSON(),
//       user_type: getUserType(user)
//     }));

//     ctx.status = 200;
//     ctx.body = {
//       message: 'Users fetched successfully',
//       status: true,
//       data: usersWithType
//     };
//   } catch (err) {
//     ctx.status = 500;
//     ctx.body = {
//       message: 'Failed to fetch users',
//       status: false,
//       data: err.message || 'An error occurred'
//     };
//   }
// };

// Get end users list
const getEndUserList = async ctx => {
  try {
    const users = await User.findAll({
      where: {
        is_admin: false,
        is_practitioner: false
      },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    const usersWithType = users.map(user => ({
      ...user.toJSON(),
      user_type: 'user'
    }));

    ctx.status = 200;
    ctx.body = {
      message: 'Users fetched successfully',
      status: true,
      data: usersWithType
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch regular users',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

const updateUserStatus = async ctx => {
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

    // Update user status and reason
    await user.update({
      status,
      reason
    });

    // Fetch all users list after successful update (like getEndUserList)
    const users = await User.findAll({
      where: {
        is_admin: false,
        is_practitioner: false
      },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'reason', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    const usersWithType = users.map(user => ({
      ...user.toJSON(),
      user_type: 'user'
    }));

    ctx.status = 200;
    ctx.body = {
      message: `User status updated to ${status === '1' ? 'active' : 'inactive'} successfully`,
      status: true,
      data: usersWithType
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update user status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete user (Admin only)
const deleteUser = async ctx => {
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

    // Delete the user (soft delete since paranoid: true)
    await user.destroy();

    // Fetch all users list after successful deletion (like getEndUserList)
    const users = await User.findAll({
      where: {
        is_admin: false,
        is_practitioner: false
      },
      attributes: ['id', 'name', 'email', 'phone', 'status', 'reason', 'createdAt', 'updatedAt'],
      order: [['createdAt', 'DESC']]
    });

    const usersWithType = users.map(user => ({
      ...user.toJSON(),
      user_type: 'user'
    }));

    ctx.status = 200;
    ctx.body = {
      message: 'User deleted successfully',
      status: true,
      data: usersWithType
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete user',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get user detail with bookings (Admin only)
const getUserDetail = async ctx => {
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

    // First get user without associations to check if user exists
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

    // Get user bookings separately to handle potential association issues
    const bookings = await db.Booking.findAll({
      where: { userId: userId },
      attributes: ['id', 'seatsBooked', 'amountPaid', 'status', 'bookingTime', 'referralCodeUsed', 'createdAt'],
      include: [
        {
          model: db.Class,
          as: 'class',
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
      user_type: getUserType(user),
      bookings: bookingsWithModalities
    };

    ctx.status = 200;
    ctx.body = {
      message: 'User details fetched successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in getUserDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch user details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update user role (Admin only)
const updateUserRole = async ctx => {
  try {
    const { userId } = ctx.params;
    const { user_type } = ctx.request.body;

    // Validate user type
    const validTypes = ['admin', 'practitioner', 'user'];
    if (!validTypes.includes(user_type)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid user type. Must be admin, practitioner, or user',
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

    // Update user role
    await user.update({
      is_admin: user_type === 'admin',
      is_practitioner: user_type === 'practitioner'
    });

    const updatedUser = await User.findByPk(userId);
    const responseData = {
      ...updatedUser.toJSON(),
      user_type: getUserType(updatedUser)
    };

    delete responseData.password;
    delete responseData.access_token;
    delete responseData.reset_password_token;

    ctx.status = 200;
    ctx.body = {
      message: `User role updated to ${user_type} successfully`,
      status: true,
      data: responseData
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update user role',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get current user profile (Any authenticated user)
const getCurrentUserProfile = async ctx => {
  try {
    const { id } = ctx.customData;

    const user = await User.findByPk(id);
    if (!user) {
      ctx.status = 404;
      ctx.body = {
        message: 'User not found',
        status: false,
        data: null
      };
      return;
    }

    const responseData = {
      ...user.toJSON(),
      user_type: getUserType(user)
    };

    delete responseData.password;
    delete responseData.access_token;
    delete responseData.reset_password_token;

    ctx.status = 200;
    ctx.body = {
      message: 'User profile fetched successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch user profile',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update current user profile (Any authenticated user, only their own profile)
const updateUserProfile = async ctx => {
  try {
    const { id: userId } = ctx.customData; // Current user ID from token
    const { name, phone, preferred_location, profile_photo_url, latitude, longitude, device_id, device_token } =
      ctx.request.body;

    // Validate required fields
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: 'Name is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the user
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

    // Prepare update data with only allowed fields
    const updateData = {
      name
    };

    // Add optional fields if provided
    if (phone !== undefined) updateData.phone = phone;
    if (preferred_location !== undefined) updateData.preferred_location = preferred_location;
    if (profile_photo_url !== undefined) updateData.profile_photo_url = profile_photo_url;
    if (latitude !== undefined) updateData.latitude = latitude;
    if (longitude !== undefined) updateData.longitude = longitude;
    if (device_id !== undefined) updateData.device_id = device_id;
    if (device_token !== undefined) updateData.device_token = device_token;

    // Update the user profile
    await user.update(updateData);

    // Fetch updated user profile
    const updatedUser = await User.findByPk(userId);

    const responseData = {
      ...updatedUser.toJSON(),
      user_type: getUserType(updatedUser)
    };

    // Remove sensitive data from response
    delete responseData.password;
    delete responseData.access_token;
    delete responseData.reset_password_token;

    ctx.status = 200;
    ctx.body = {
      message: 'User profile updated successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in updateUserProfile:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update user profile',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Toggle account status (activate/deactivate) for logged-in user
const toggleAccountStatus = async ctx => {
  try {
    const { id: userId } = ctx.customData;
    const { action } = ctx.request.body;

    // Validate action
    if (!action || !['activate', 'deactivate'].includes(action)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Action must be "activate" or "deactivate"',
        status: false,
        data: null
      };
      return;
    }

    // Find and update user
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

    const newStatus = action === 'activate' ? '1' : '0';

    // Check if already in desired state
    if (user.status === newStatus) {
      ctx.status = 400;
      ctx.body = {
        message: `Account is already ${action === 'activate' ? 'active' : 'inactive'}`,
        status: false,
        data: null
      };
      return;
    }

    // Update status
    await user.update({ status: newStatus });

    // Return updated user data
    const responseData = {
      ...user.toJSON(),
      user_type: getUserType(user)
    };

    delete responseData.password;
    delete responseData.access_token;
    delete responseData.reset_password_token;

    ctx.status = 200;
    ctx.body = {
      message: `Account ${action}d successfully`,
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in toggleAccountStatus:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to toggle account status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  // getUserList,
  getEndUserList,
  updateUserRole,
  updateUserStatus,
  deleteUser,
  getUserDetail,
  getCurrentUserProfile,
  updateUserProfile,
  toggleAccountStatus
};
