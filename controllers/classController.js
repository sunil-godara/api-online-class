require('dotenv').config();
// const { Op } = require('sequelize');
const db = require('../models');
const User = db.User;
const Studio = db.Studio;
const StudioRoom = db.StudioRoom;
const Class = db.Class;

// Create class (Practitioner only)
const createClass = async ctx => {
  try {
    const {
      studioId,
      roomId,
      title,
      description,
      tags,
      location,
      dateTime,
      endTime,
      durationMins,
      capacity,
      price,
      resourceLinks,
      commissionRateOverride,
      modalityIds
    } = ctx.request.body;
    const { id: userId } = ctx.customData; // Current user ID from token

    // Validate required fields
    if (!title) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class title is required',
        status: false,
        data: null
      };
      return;
    }

    if (!description) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class description is required',
        status: false,
        data: null
      };
      return;
    }

    if (!dateTime || !endTime) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class start and end date and time is required',
        status: false,
        data: null
      };
      return;
    }

    if (!durationMins || durationMins <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class duration is required',
        status: false,
        data: null
      };
      return;
    }

    if (!capacity || capacity <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class capacity is required',
        status: false,
        data: null
      };
      return;
    }

    if (!price || price <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class price is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate modalityIds (required field)
    if (!modalityIds || !Array.isArray(modalityIds) || modalityIds.length === 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality IDs are required and must be a non-empty array',
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
        message: 'Only practitioners can create classes',
        status: false,
        data: null
      };
      return;
    }

    // Validate modalityIds exist in the modalities table
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

    // Validate studio ownership if studioId is provided
    if (studioId) {
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

      if (studio.createdBy !== userId) {
        ctx.status = 403;
        ctx.body = {
          message: 'You can only create classes in your own studios',
          status: false,
          data: null
        };
        return;
      }

      // Validate room ownership if roomId is provided
      if (roomId) {
        const room = await StudioRoom.findByPk(roomId);
        if (!room) {
          ctx.status = 404;
          ctx.body = {
            message: 'Room not found',
            status: false,
            data: null
          };
          return;
        }

        if (room.studioId !== studioId) {
          ctx.status = 400;
          ctx.body = {
            message: 'Room does not belong to the specified studio',
            status: false,
            data: null
          };
          return;
        }
      }
    }

    // Create the class
    const classData = {
      practitionerId: userId,
      title,
      description,
      tags,
      location,
      dateTime,
      durationMins,
      capacity,
      price,
      resourceLinks,
      commissionRateOverride,
      approvalStatus: 'pending'
    };

    // Add optional fields if provided
    if (studioId) classData.studioId = studioId;
    if (roomId) classData.roomId = roomId;

    const newClass = await Class.create(classData);

    // Create class modalities
    const classModalities = modalityIds.map(modalityId => ({
      classId: newClass.id,
      modalityId: modalityId
    }));

    await db.ClassModality.bulkCreate(classModalities);

    // Fetch created class with associations and modalities
    const createdClass = await Class.findByPk(newClass.id, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
    });

    // Transform the response to include modalities in a cleaner format
    const responseData = {
      ...createdClass.toJSON(),
      modalities: createdClass.classModalities ? createdClass.classModalities.map(cm => cm.modality) : []
    };

    ctx.status = 201;
    ctx.body = {
      message: 'Class created successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in createClass:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create class',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// List classes (Practitioner: own classes, Admin: all classes)
const listClasses = async ctx => {
  try {
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    let whereClause = {};

    // If not admin, only show classes created by the current user
    if (!is_admin) {
      whereClause.practitionerId = userId;
    }

    const classes = await Class.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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

    // Transform the response to include modalities in a cleaner format
    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Classes fetched successfully',
      status: true,
      data: classesWithModalities
    };
  } catch (err) {
    console.error('Error in listClasses:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch classes',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get class detail (Practitioner: own class, Admin: any class)
const getClassDetail = async ctx => {
  try {
    const { classId } = ctx.request.body; // Get class ID from request body

    // Validate required fields
    if (!classId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the class
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
    });

    if (!classData) {
      ctx.status = 404;
      ctx.body = {
        message: 'Class not found',
        status: false,
        data: null
      };
      return;
    }

    // Transform the response to include modalities in a cleaner format
    const responseData = {
      ...classData.toJSON(),
      modalities: classData.classModalities ? classData.classModalities.map(cm => cm.modality) : []
    };

    ctx.status = 200;
    ctx.body = {
      message: 'Class details fetched successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in getClassDetail:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch class details',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit class (Practitioner only, only their own)
const editClass = async ctx => {
  try {
    const {
      classId,
      studioId,
      roomId,
      title,
      description,
      tags,
      location,
      dateTime,
      durationMins,
      capacity,
      price,
      resourceLinks,
      commissionRateOverride,
      modalityIds
    } = ctx.request.body; // Get class ID and data from request body
    const { id: userId } = ctx.customData; // Current user ID from token

    // Validate required fields
    if (!classId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!title) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class title is required',
        status: false,
        data: null
      };
      return;
    }

    if (!description) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class description is required',
        status: false,
        data: null
      };
      return;
    }

    if (!dateTime) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class date and time is required',
        status: false,
        data: null
      };
      return;
    }

    if (!durationMins || durationMins <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class duration is required',
        status: false,
        data: null
      };
      return;
    }

    if (!capacity || capacity <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class capacity is required',
        status: false,
        data: null
      };
      return;
    }

    if (!price || price <= 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid class price is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate modalityIds (required field)
    if (!modalityIds || !Array.isArray(modalityIds) || modalityIds.length === 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality IDs are required and must be a non-empty array',
        status: false,
        data: null
      };
      return;
    }

    // Validate modalityIds exist in the modalities table
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

    // Find the class
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        }
      ]
    });

    if (!classData) {
      ctx.status = 404;
      ctx.body = {
        message: 'Class not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if user owns the class
    if (classData.practitionerId !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only edit your own classes',
        status: false,
        data: null
      };
      return;
    }

    // Validate studio ownership if studioId is provided
    if (studioId) {
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

      if (studio.createdBy !== userId) {
        ctx.status = 403;
        ctx.body = {
          message: 'You can only assign classes to your own studios',
          status: false,
          data: null
        };
        return;
      }

      // Validate room ownership if roomId is provided
      if (roomId) {
        const room = await StudioRoom.findByPk(roomId);
        if (!room) {
          ctx.status = 404;
          ctx.body = {
            message: 'Room not found',
            status: false,
            data: null
          };
          return;
        }

        if (room.studioId !== studioId) {
          ctx.status = 400;
          ctx.body = {
            message: 'Room does not belong to the specified studio',
            status: false,
            data: null
          };
          return;
        }
      }
    }

    // Update the class
    const updateData = {
      title,
      description,
      tags,
      location,
      dateTime,
      durationMins,
      capacity,
      price,
      resourceLinks,
      commissionRateOverride,
      approvalStatus: 'pending' // Reset approval status to pending for admin review
    };

    // Add optional fields if provided
    if (studioId !== undefined) updateData.studioId = studioId;
    if (roomId !== undefined) updateData.roomId = roomId;

    await classData.update(updateData);

    // Handle modalityIds - delete existing and create new ones
    await db.ClassModality.destroy({
      where: { classId: classId }
    });

    // Create new class modalities
    const classModalities = modalityIds.map(modalityId => ({
      classId: classId,
      modalityId: modalityId
    }));

    await db.ClassModality.bulkCreate(classModalities);

    // Fetch updated class with modalities
    const updatedClass = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
    });

    // Transform the response to include modalities in a cleaner format
    const responseData = {
      ...updatedClass.toJSON(),
      modalities: updatedClass.classModalities ? updatedClass.classModalities.map(cm => cm.modality) : []
    };

    ctx.status = 200;
    ctx.body = {
      message: 'Class updated successfully',
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in editClass:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update class',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete class (Practitioner only, only their own)
const deleteClass = async ctx => {
  try {
    const { classId } = ctx.request.body; // Get class ID from request body
    const { id: userId } = ctx.customData; // Current user ID from token
    const is_admin = ctx.user ? ctx.user.is_admin : false; // Get admin status from ctx.user

    // Validate required fields
    if (!classId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find the class
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        }
      ]
    });

    if (!classData) {
      ctx.status = 404;
      ctx.body = {
        message: 'Class not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if user owns the class
    if (classData.practitionerId !== userId) {
      ctx.status = 403;
      ctx.body = {
        message: 'You can only delete your own classes',
        status: false,
        data: null
      };
      return;
    }

    // Delete class modalities first
    await db.ClassModality.destroy({
      where: { classId: classId }
    });

    // Delete the class (soft delete since paranoid: true)
    await classData.destroy();

    // Fetch classes list after successful deletion with same permission logic as listClasses
    let whereClause = {};

    // If not admin, only show classes created by the current user
    if (!is_admin) {
      whereClause.practitionerId = userId;
    }

    const classes = await Class.findAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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

    // Transform the response to include modalities in a cleaner format
    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData,
        modalities: classData.classModalities ? classData.classModalities.map(cm => cm.modality) : []
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Class deleted successfully',
      status: true,
      data: classesWithModalities
    };
  } catch (err) {
    console.error('Error in deleteClass:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete class',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update class approval status (Admin only)
const updateClassApproval = async ctx => {
  try {
    const { classId, approvalStatus } = ctx.request.body;

    // Validate required fields
    if (!classId) {
      ctx.status = 400;
      ctx.body = {
        message: 'Class ID is required',
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

    // Find the class
    const classData = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
    });

    if (!classData) {
      ctx.status = 404;
      ctx.body = {
        message: 'Class not found',
        status: false,
        data: null
      };
      return;
    }

    // Update the approval status
    await classData.update({
      approvalStatus: approvalStatus
    });

    // Fetch updated class with modalities
    const updatedClass = await Class.findByPk(classId, {
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
    });

    // Transform the response to include modalities in a cleaner format
    const responseData = {
      ...updatedClass.toJSON(),
      modalities: updatedClass.classModalities ? updatedClass.classModalities.map(cm => cm.modality) : []
    };

    ctx.status = 200;
    ctx.body = {
      message: `Class ${approvalStatus} successfully`,
      status: true,
      data: responseData
    };
  } catch (err) {
    console.error('Error in updateClassApproval:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update class approval status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Class listing for end users
const classListing = async ctx => {
  try {
    // This function is specifically for end users to view approved classes
    const classes = await Class.findAll({
      where: { approvalStatus: 'approved' }, // Only show approved classes
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
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
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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

    // Transform the response to include modalities in a cleaner format
    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        ...classData
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Approved classes fetched successfully',
      status: true,
      data: classesWithModalities
    };
  } catch (err) {
    console.error('Error in classListing:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch classes',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

const recommendedClasses = async ctx => {
  try {
    const classes = await Class.findAll({
      where: {
        approvalStatus: 'approved'
        // dateTime: {
        //   [Op.gte]: new Date() // Use dateTime for future classes
        // }
      },
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus'],
          where: { approvalStatus: 'approved' }
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
      order: [
        ['dateTime', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: 50
    });

    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        id: classData.id,
        title: classData.title,
        description: classData.description,
        dateTime: classData.dateTime,
        duration: classData.durationMins,
        price: classData.price,
        practitioner: {
          id: classData.practitioner.id,
          name: classData.practitioner.name
        },
        studio: {
          id: classData.studio.id,
          name: classData.studio.name,
          location: classData.studio.location
        },
        room: classData.room
          ? {
              id: classData.room.id,
              name: classData.room.name,
              capacity: classData.room.capacity
            }
          : null,
        modalities: classData.classModalities.map(cm => ({
          id: cm.modality.id,
          name: cm.modality.name,
          slug: cm.modality.slug,
          description: cm.modality.description,
          iconUrl: cm.modality.iconUrl
        })),
        availableSpots: classData.room && classData.capacity ? classData.capacity : null
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Recommended classes fetched successfully',
      status: true,
      data: classesWithModalities,
      count: classesWithModalities.length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in recommendedClasses:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch recommended classes',
      status: false,
      error: err.message || 'An internal server error occurred'
    };
  }
};

const upcomingClasses = async ctx => {
  try {
    const classes = await Class.findAll({
      where: {
        approvalStatus: 'approved'
        // dateTime: {
        //   [Op.gte]: new Date() // Only future classes
        // }
      },
      include: [
        {
          model: User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus'],
          where: { approvalStatus: 'approved' }
        },
        {
          model: StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
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
      order: [
        ['dateTime', 'ASC'], // Sort by soonest classes first
        ['createdAt', 'DESC']
      ],
      limit: 50 // Limit results to prevent overload
    });

    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        id: classData.id,
        title: classData.title,
        description: classData.description,
        dateTime: classData.dateTime,
        duration: classData.durationMins,
        price: classData.price,
        practitioner: {
          id: classData.practitioner.id,
          name: classData.practitioner.name
        },
        studio: {
          id: classData.studio.id,
          name: classData.studio.name,
          location: classData.studio.location
        },
        room: classData.room
          ? {
              id: classData.room.id,
              name: classData.room.name,
              capacity: classData.room.capacity
            }
          : null,
        modalities: classData.classModalities.map(cm => ({
          id: cm.modality.id,
          name: cm.modality.name,
          slug: cm.modality.slug,
          description: cm.modality.description,
          iconUrl: cm.modality.iconUrl
        })),
        availableSpots: classData.room && classData.capacity ? classData.capacity : null
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Upcoming classes fetched successfully',
      status: true,
      data: classesWithModalities,
      count: classesWithModalities.length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in upcomingClasses:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch upcoming classes',
      status: false,
      error: err.message || 'An internal server error occurred'
    };
  }
};

const getClassByModality = async ctx => {
  try {
    const { id: modalityId } = ctx.params;

    const classes = await db.Class.findAll({
      where: {
        approvalStatus: 'approved'
      },
      include: [
        {
          model: db.ClassModality,
          as: 'classModalities',
          where: { modalityId }, // 🔥 Filter here
          include: [
            {
              model: db.Modality,
              as: 'modality',
              attributes: ['id', 'name', 'slug', 'description', 'iconUrl']
            }
          ]
        },
        {
          model: db.User,
          as: 'practitioner',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: db.Studio,
          as: 'studio',
          attributes: ['id', 'name', 'location', 'approvalStatus'],
          where: { approvalStatus: 'approved' }
        },
        {
          model: db.StudioRoom,
          as: 'room',
          attributes: ['id', 'name', 'capacity']
        }
      ],
      order: [
        ['dateTime', 'ASC'],
        ['createdAt', 'DESC']
      ],
      limit: 50
    });

    const classesWithModalities = classes.map(classItem => {
      const classData = classItem.toJSON();
      return {
        id: classData.id,
        title: classData.title,
        description: classData.description,
        dateTime: classData.dateTime,
        duration: classData.durationMins,
        price: classData.price,
        practitioner: {
          id: classData.practitioner.id,
          name: classData.practitioner.name
        },
        studio: {
          id: classData.studio.id,
          name: classData.studio.name,
          location: classData.studio.location
        },
        room: classData.room
          ? {
              id: classData.room.id,
              name: classData.room.name,
              capacity: classData.room.capacity
            }
          : null,
        modalities: classData.classModalities.map(cm => ({
          id: cm.modality.id,
          name: cm.modality.name,
          slug: cm.modality.slug,
          description: cm.modality.description,
          iconUrl: cm.modality.iconUrl
        })),
        availableSpots: classData.room?.capacity ?? null
      };
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Classes fetched successfully',
      status: true,
      data: classesWithModalities,
      count: classesWithModalities.length,
      timestamp: new Date().toISOString()
    };
  } catch (err) {
    console.error('Error in getClassByModality:', err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch class by modality',
      status: false,
      error: err.message || 'An internal server error occurred'
    };
  }
};

module.exports = {
  createClass,
  listClasses,
  getClassDetail,
  editClass,
  deleteClass,
  updateClassApproval,
  classListing,
  recommendedClasses,
  upcomingClasses,
  getClassByModality
};
