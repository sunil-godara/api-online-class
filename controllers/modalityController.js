require('dotenv').config();
const db = require('../models');
const Modality = db.Modality;
const { Op } = require('sequelize');

// Create modality (Admin only)
const createModality = async ctx => {
  try {
    const { name, description, iconUrl } = ctx.request.body;

    // Validate required fields
    if (!name) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality name is required',
        status: false,
        data: null
      };
      return;
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Check if slug already exists
    const existingModality = await Modality.findOne({
      where: { slug }
    });

    if (existingModality) {
      ctx.status = 400;
      ctx.body = {
        message: 'A modality with this name already exists',
        status: false,
        data: null
      };
      return;
    }

    // Create the modality
    const modalityData = {
      name,
      slug,
      status: '1'
    };

    // Add optional fields if provided
    if (description) modalityData.description = description;
    if (iconUrl) modalityData.iconUrl = iconUrl;

    const newModality = await Modality.create(modalityData);

    ctx.status = 201;
    ctx.body = {
      message: 'Modality created successfully',
      status: true,
      data: newModality
    };
  } catch (error) {
    console.error('Create modality error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

// List modalities (All users can view)
const listModalities = async ctx => {
  try {
    const { status, search } = ctx.query;
    const { userType } = ctx;

    // Build where clause
    const whereClause = {};

    // Admin can see all modalities, others only see active ones
    if (userType !== 'admin') {
      whereClause.status = '1';
    } else if (status) {
      whereClause.status = status;
    }

    // Add search functionality
    if (search) {
      whereClause[Op.or] = [{ name: { [Op.iLike]: `%${search}%` } }, { description: { [Op.iLike]: `%${search}%` } }];
    }

    const modalities = await Modality.findAll({
      where: whereClause,
      order: [['name', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Modalities retrieved successfully',
      status: true,
      data: modalities.map(modality => modality.toJSON())
    };
  } catch (error) {
    console.error('List modalities error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

// Get modality detail (All users can view)
const getModalityDetail = async ctx => {
  try {
    const { id } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality ID is required',
        status: false,
        data: null
      };
      return;
    }

    const modality = await Modality.findByPk(id);

    if (!modality) {
      ctx.status = 404;
      ctx.body = {
        message: 'Modality not found',
        status: false,
        data: null
      };
      return;
    }

    // Non-admin users can only see active modalities
    const { userType } = ctx;
    if (userType !== 'admin' && modality.status !== '1') {
      ctx.status = 404;
      ctx.body = {
        message: 'Modality not found',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Modality retrieved successfully',
      status: true,
      data: modality
    };
  } catch (error) {
    console.error('Get modality detail error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

// Edit modality (Admin only)
const editModality = async ctx => {
  try {
    const { id, name, description, iconUrl, status } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality ID is required',
        status: false,
        data: null
      };
      return;
    }

    const modality = await Modality.findByPk(id);

    if (!modality) {
      ctx.status = 404;
      ctx.body = {
        message: 'Modality not found',
        status: false,
        data: null
      };
      return;
    }

    // Prepare update data
    const updateData = {};

    if (name) {
      updateData.name = name;
      // Generate new slug if name changed
      const newSlug = name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      // Check if new slug already exists (excluding current modality)
      const existingModality = await Modality.findOne({
        where: {
          slug: newSlug,
          id: { [Op.ne]: id }
        }
      });

      if (existingModality) {
        ctx.status = 400;
        ctx.body = {
          message: 'A modality with this name already exists',
          status: false,
          data: null
        };
        return;
      }

      updateData.slug = newSlug;
    }

    if (description !== undefined) updateData.description = description;
    if (iconUrl !== undefined) updateData.iconUrl = iconUrl;
    if (status) updateData.status = status;

    // Update the modality
    await modality.update(updateData);

    ctx.status = 200;
    ctx.body = {
      message: 'Modality updated successfully',
      status: true,
      data: modality
    };
  } catch (error) {
    console.error('Edit modality error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

// Delete modality (Admin only)
const deleteModality = async ctx => {
  try {
    const { id } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality ID is required',
        status: false,
        data: null
      };
      return;
    }

    const modality = await Modality.findByPk(id);

    if (!modality) {
      ctx.status = 404;
      ctx.body = {
        message: 'Modality not found',
        status: false,
        data: null
      };
      return;
    }

    // Check if modality is being used in classes through class-modalities table
    const classModalityCount = await db.ClassModality.count({
      where: { modalityId: id }
    });

    if (classModalityCount > 0) {
      ctx.status = 400;
      ctx.body = {
        message: 'Cannot delete modality as it is being used by classes. Please update or remove the classes first.',
        status: false,
        data: null
      };
      return;
    }

    // Check if modality is being used by practitioners through practitioner-modalities table
    const practitionerModalityCount = await db.PractitionerModality.count({
      where: { modalityId: id }
    });

    if (practitionerModalityCount > 0) {
      ctx.status = 400;
      ctx.body = {
        message:
          'Cannot delete modality as it is being used by practitioners. Please update or remove the practitioner profiles first.',
        status: false,
        data: null
      };
      return;
    }

    // Soft delete the modality
    await modality.destroy();

    // Get remaining modalities
    const modalities = await Modality.findAll({
      order: [['name', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Modality deleted successfully',
      status: true,
      data: modalities
    };
  } catch (error) {
    console.error('Delete modality error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

// Update modality status (Admin only)
const updateModalityStatus = async ctx => {
  try {
    const { id, status } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Modality ID is required',
        status: false,
        data: null
      };
      return;
    }

    if (!status || !['0', '1'].includes(status)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Valid status is required (0 for inactive or 1 for active)',
        status: false,
        data: null
      };
      return;
    }

    const modality = await Modality.findByPk(id);

    if (!modality) {
      ctx.status = 404;
      ctx.body = {
        message: 'Modality not found',
        status: false,
        data: null
      };
      return;
    }

    // Update the status
    await modality.update({ status });

    const modalities = await Modality.findAll({
      order: [['name', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Modality status updated successfully',
      status: true,
      data: modalities
    };
  } catch (error) {
    console.error('Update modality status error:', error);
    ctx.status = 500;
    ctx.body = {
      message: 'Internal server error',
      status: false,
      data: null
    };
  }
};

module.exports = {
  createModality,
  listModalities,
  getModalityDetail,
  editModality,
  deleteModality,
  updateModalityStatus
};
