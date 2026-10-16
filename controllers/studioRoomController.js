require('dotenv').config();
const db = require('../models');
const User = db.User;
const Studio = db.Studio;
const StudioRoom = db.StudioRoom;

// Create studio room (Practitioner only, in their own approved studio)
const createStudioRoom = async ctx => {
  try {
    const { studioId, name, capacity } = ctx.request.body;
    const { id: userId } = ctx.customData; // Current user ID from token

    // Validate required fields
    if (!studioId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Studio ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: 'Room name is required',
        status: false,
        data: null
      };
      return;
    }

    if (!capacity || capacity <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid room capacity is required',
        status: false,
        data: null
      };
      return;
    }

    // Check if user is a practitioner
    const user = await User.findByPk(userId);
    if (!user || !user.is_practitioner) {
      ctx.status = 403;
      ctx.body = {
        message: 'Only practitioners can create studio rooms',
        status: false,
        data: null
      };
      return;
    }

    // Find the studio and verify ownership and approval status
    const studio = await Studio.findByPk(studioId);
    if (!studio) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if user owns the studio
    if (studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only create rooms in your own studio',
        status: false,
        data: null
      };
      return;
    }

    // Check if studio is approved
    if (studio.approvalStatus !== 'approved') {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only create rooms in approved studios',
        status: false,
        data: null
      };
      return;
    }

    // Create the studio room
    const studioRoom = await StudioRoom.create({
      studioId,
      name,
      capacity
    });

    // Fetch created studio room with studio details
    const createdStudioRoom = await StudioRoom.findByPk(studioRoom.id, {
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus', 'createdBy'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    ctx.status = 201;
    ctx.body = {
      message: 'Studio room created successfully',
      status: true,
      data: createdStudioRoom
    };
  } catch (err) {
    console.error('Error in createStudioRoom:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create studio room',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// List studio rooms (Practitioner: own studio rooms, Admin: all studio rooms)
const listStudioRooms = async ctx => {
  try {
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    let whereClause = {};

    // If not admin, only show rooms from studios created by the current user
    if (!is_admin) {
      whereClause = {
        '$studio.createdBy$': userId
      };
    }

    const studioRooms = await StudioRoom.findAll({
      where: whereClause,
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus', 'createdBy'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studio rooms fetched successfully',
      status: true,
      data: studioRooms
    };
  } catch (err) {
    console.error('Error in listStudioRooms:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch studio rooms',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get studio room detail (Practitioner: own studio room, Admin: any studio room)
const getStudioRoomDetail = async ctx => {
  try {
    const { roomId } = ctx.request.body; // Get room ID from request body
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    // Validate required fields
    if (!roomId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Room ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the studio room
    const studioRoom = await StudioRoom.findByPk(roomId, {
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus', 'createdBy'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!studioRoom) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio room not found',
        status: false,
        data: null
      };
      return;
    }

    // Check access permissions
    if (!is_admin && studioRoom.studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only view rooms in your own studios',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Studio room details fetched successfully',
      status: true,
      data: studioRoom
    };
  } catch (err) {
    console.error('Error in getStudioRoomDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch studio room details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit studio room (Practitioner only, only their own)
const editStudioRoom = async ctx => {
  try {
    const { roomId, name, capacity } = ctx.request.body; // Get room ID and data from request body
    const { id: userId } = ctx.customData; // Current user ID from token

    // Validate required fields
    if (!roomId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Room ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: 'Room name is required',
        status: false,
        data: null
      };
      return;
    }

    if (!capacity || capacity <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid room capacity is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the studio room
    const studioRoom = await StudioRoom.findByPk(roomId, {
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus', 'createdBy'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!studioRoom) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio room not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if studio has a creator
    if (!studioRoom.studio.createdBy) {
      ctx.status = 403;
      ctx.body = {
        message: 'Studio does not have a valid creator',
        status: false,
        data: null
      };
      return;
    }

    // Check if user owns the studio that contains this room
    if (studioRoom.studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only edit rooms in your own studios',
        status: false,
        data: null
      };
      return;
    }

    // Update the studio room
    await studioRoom.update({
      name,
      capacity
    });

    // Fetch updated studio room
    const updatedStudioRoom = await StudioRoom.findByPk(roomId, {
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studio room updated successfully',
      status: true,
      data: updatedStudioRoom
    };
  } catch (err) {
    console.error('Error in editStudioRoom:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update studio room',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete studio room (Practitioner only, only their own)
const deleteStudioRoom = async ctx => {
  try {
    const { roomId } = ctx.request.body; // Get room ID from request body
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    // Validate required fields
    if (!roomId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Room ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the studio room
    const studioRoom = await StudioRoom.findByPk(roomId, {
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus', 'createdBy'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ]
    });

    if (!studioRoom) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio room not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if user owns the studio that contains this room
    if (studioRoom.studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only delete rooms in your own studios',
        status: false,
        data: null
      };
      return;
    }

    // Delete the studio room (soft delete since paranoid: true)
    await studioRoom.destroy();

    // Fetch studio rooms list after successful deletion with same permission logic as listStudioRooms
    let whereClause = {};

    // If not admin, only show rooms from studios created by the current user
    if (!is_admin) {
      whereClause = {
        '$studio.createdBy$': userId
      };
    }

    const studioRooms = await StudioRoom.findAll({
      where: whereClause,
      include: [
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus'],
          include: [
            {
              model: User,
              as: 'creator',
              attributes: ['id', 'name', 'email', 'phone']
            }
          ]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studio room deleted successfully',
      status: true,
      data: studioRooms
    };
  } catch (err) {
    console.error('Error in deleteStudioRoom:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete studio room',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  createStudioRoom,
  listStudioRooms,
  getStudioRoomDetail,
  editStudioRoom,
  deleteStudioRoom
};
