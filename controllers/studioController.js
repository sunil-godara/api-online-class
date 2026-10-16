require('dotenv').config();
const db = require('../models');
const User = db.User;
const Studio = db.Studio;

// Create studio (Practitioner only)
const createStudio = async ctx => {
  try {
    const { name, location, description, logoUrl } = ctx.request.body;
    const { id: userId } = ctx.customData;

    // Validate required fields
    if (!name || !location) {
      ctx.status = 400;
      ctx.body = {
        message: 'Studio name and location are required',
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
        message: 'Only practitioners can create studios',
        status: false,
        data: null
      };
      return;
    }

    // Check if studio already exists for this user
    const existingStudio = await Studio.findOne({ where: { createdBy: userId } });

    let studio;
    if (existingStudio) {
      await existingStudio.update({
        name,
        location,
        description,
        logoUrl,
        approvalStatus: 'pending'
      });
      studio = existingStudio;
    } else {
      // Create new studio
      studio = await Studio.create({
        name,
        location,
        description,
        logoUrl,
        createdBy: userId,
        approvalStatus: 'pending'
      });
    }

    // Fetch studio with creator details
    const studioWithCreator = await Studio.findByPk(studio.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: existingStudio ? 'Studio updated successfully' : 'Studio created successfully',
      status: true,
      data: studioWithCreator
    };
  } catch (err) {
    console.error('Error in createStudio:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create or update studio',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit studio (Practitioner only, only their own)
const editStudio = async ctx => {
  try {
    const { studioId, name, location, description, logoUrl } = ctx.request.body; // Get studio ID and data from request body
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
        message: 'Studio name is required',
        status: false,
        data: null
      };
      return;
    }

    if (!location) {
      ctx.status = 400;
      ctx.body = {
        message: 'Studio location is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the studio
    const studio = await Studio.findByPk(studioId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!studio) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if user is the creator of the studio
    if (studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only edit your own studio',
        status: false,
        data: null
      };
      return;
    }

    // Update the studio
    await studio.update({
      name,
      location,
      description,
      logoUrl,
      approvalStatus: 'pending'
    });

    // Fetch updated studio
    const updatedStudio = await Studio.findByPk(studioId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studio updated successfully',
      status: true,
      data: updatedStudio
    };
  } catch (err) {
    console.error('Error in editStudio:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update studio',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// View studio details (Practitioner: own studio, Admin: any studio)
const getStudioDetail = async ctx => {
  try {
    const { studioId } = ctx.request.body; // Get studio ID from request body
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

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

    // Find the studio
    const studio = await Studio.findByPk(studioId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!studio) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio not found',
        status: false,
        data: null
      };
      return;
    }

    // Check access permissions
    if (!is_admin && studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only view your own studio',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Studio details fetched successfully',
      status: true,
      data: studio
    };
  } catch (err) {
    console.error('Error in getStudioDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch studio details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete studio (Practitioner only, only their own)
const deleteStudio = async ctx => {
  try {
    const { studioId } = ctx.request.body; // Get studio ID from request body
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

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

    // Find the studio
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

    // Check if user is the creator of the studio
    if (studio.createdBy !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only delete your own studio',
        status: false,
        data: null
      };
      return;
    }

    // Delete the studio (soft delete since paranoid: true)
    await studio.destroy();

    // Fetch studios list after successful deletion with same permission logic as listStudios
    let whereClause = {};

    // If not admin, only show studios created by the current user
    if (!is_admin) {
      whereClause.createdBy = userId;
    }

    const studios = await Studio.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studio deleted successfully',
      status: true,
      data: studios
    };
  } catch (err) {
    console.error('Error in deleteStudio:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete studio',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// List studios (Practitioner: own studio, Admin: all studios)
const listStudios = async ctx => {
  try {
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    let whereClause = {};

    // If not admin, only show studios created by the current user
    if (!is_admin) {
      whereClause.createdBy = userId;
    }

    const studios = await Studio.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Studios fetched successfully',
      status: true,
      data: studios
    };
  } catch (err) {
    console.error('Error in listStudios:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch studios',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update studio approval status (Admin only)
const updateStudioApproval = async ctx => {
  try {
    const { studioId, approvalStatus } = ctx.request.body;

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

    // Find the studio
    const studio = await Studio.findByPk(studioId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    if (!studio) {
      ctx.status = 404;
      ctx.body = {
        message: 'Studio not found',
        status: false,
        data: null
      };
      return;
    }

    // Update the approval status
    await studio.update({
      approvalStatus: approvalStatus
    });

    // Fetch updated studio
    const updatedStudio = await Studio.findByPk(studioId, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'name', 'email', 'phone']
        }
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: `Studio ${approvalStatus} successfully`,
      status: true,
      data: updatedStudio
    };
  } catch (err) {
    console.error('Error in updateStudioApproval:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update studio approval status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  createStudio,
  editStudio,
  getStudioDetail,
  deleteStudio,
  listStudios,
  updateStudioApproval
};
