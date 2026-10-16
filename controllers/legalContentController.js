require('dotenv').config();
const db = require('../models');
const LegalContent = db.LegalContent;

// Add Content
const addLegalContent = async ctx => {
  try {
    const { title, content, version, status, isPublish } = ctx.request.body;

    // Validate required fields
    if (!title || !content || !version) {
      ctx.status = 400;
      ctx.body = {
        message: 'Title, content, and version are required',
        status: false,
        data: null
      };
      return;
    }

    // Generate slug from title
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    // Validate slug uniqueness
    const existingContent = await LegalContent.findOne({
      where: { slug }
    });

    if (existingContent) {
      ctx.status = 400;
      ctx.body = {
        message: 'A legal content with this title already exists',
        status: false,
        data: null
      };
      return;
    }

    // Validate status and isPublish values
    const validValues = ['0', '1'];
    if (status && !validValues.includes(status)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Status must be "0" (inactive) or "1" (active)',
        status: false,
        data: null
      };
      return;
    }

    if (isPublish && !validValues.includes(isPublish)) {
      ctx.status = 400;
      ctx.body = {
        message: 'isPublish must be "0" (unpublished) or "1" (published)',
        status: false,
        data: null
      };
      return;
    }

    // Create new legal content
    const newContent = await LegalContent.create({
      title,
      slug,
      content,
      version,
      status: status || '1',
      isPublish: isPublish || '0'
    });

    ctx.status = 201;
    ctx.body = {
      message: 'Legal content created successfully',
      status: true,
      data: newContent
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create legal content',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit Content
const editLegalContent = async ctx => {
  try {
    const { id, title, content, version, status, isPublish } = ctx.request.body;

    // Validate required fields
    if (!id || !title || !content || !version) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID, title, content, and version are required',
        status: false,
        data: null
      };
      return;
    }

    // Find the legal content
    const legalContent = await LegalContent.findByPk(id);
    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found',
        status: false,
        data: null
      };
      return;
    }

    // Validate status and isPublish values
    const validValues = ['0', '1'];
    if (status && !validValues.includes(status)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Status must be "0" (inactive) or "1" (active)',
        status: false,
        data: null
      };
      return;
    }

    if (isPublish && !validValues.includes(isPublish)) {
      ctx.status = 400;
      ctx.body = {
        message: 'isPublish must be "0" (unpublished) or "1" (published)',
        status: false,
        data: null
      };
      return;
    }

    // Update the legal content (slug is not editable)
    await legalContent.update({
      title,
      content,
      version,
      status: status !== undefined ? status : legalContent.status,
      isPublish: isPublish !== undefined ? isPublish : legalContent.isPublish
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Legal content updated successfully',
      status: true,
      data: legalContent
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update legal content',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete Content (Soft Delete)
const deleteLegalContent = async ctx => {
  try {
    const { id } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID is required',
        status: false,
        data: null
      };
      return;
    }

    const legalContent = await LegalContent.findByPk(id);
    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found',
        status: false,
        data: null
      };
      return;
    }

    // Soft delete
    await legalContent.destroy();

    const content = await LegalContent.findAll({
      order: [
        ['createdAt', 'DESC'],
        ['title', 'ASC']
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Legal content deleted successfully',
      status: true,
      data: content
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete legal content',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// View Content Detail
const getLegalContentDetail = async ctx => {
  try {
    const { id } = ctx.request.body;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID is required',
        status: false,
        data: null
      };
      return;
    }

    const legalContent = await LegalContent.findByPk(id);
    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Legal content fetched successfully',
      status: true,
      data: legalContent
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch legal content',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

const listLegalContent = async ctx => {
  try {
    const content = await LegalContent.findAll({
      order: [
        ['createdAt', 'DESC'],
        ['title', 'ASC']
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Legal content list fetched successfully',
      status: true,
      data: content
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch legal content list',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update Status
const updateLegalContentStatus = async ctx => {
  try {
    const { id, status } = ctx.request.body;

    // Validate required fields
    if (!id || !status) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID and status are required',
        status: false,
        data: null
      };
      return;
    }

    const validStatuses = ['0', '1'];
    if (!validStatuses.includes(status)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Status must be "0" (inactive) or "1" (active)',
        status: false,
        data: null
      };
      return;
    }

    const legalContent = await LegalContent.findByPk(id);
    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found',
        status: false,
        data: null
      };
      return;
    }

    await legalContent.update({ status });

    const content = await LegalContent.findAll({
      order: [
        ['createdAt', 'DESC'],
        ['title', 'ASC']
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: `Legal content status updated to ${status === '1' ? 'active' : 'inactive'} successfully`,
      status: true,
      data: content
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update legal content status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update isPublish
const updateLegalContentPublish = async ctx => {
  try {
    const { id, isPublish } = ctx.request.body;

    // Validate required fields
    if (!id || !isPublish) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID and isPublish are required',
        status: false,
        data: null
      };
      return;
    }

    const validPublishValues = ['0', '1'];
    if (!validPublishValues.includes(isPublish)) {
      ctx.status = 400;
      ctx.body = {
        message: 'isPublish must be "0" (unpublished) or "1" (published)',
        status: false,
        data: null
      };
      return;
    }

    const legalContent = await LegalContent.findByPk(id);
    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found',
        status: false,
        data: null
      };
      return;
    }

    await legalContent.update({ isPublish });

    ctx.status = 200;
    ctx.body = {
      message: `Legal content publish status updated to ${isPublish === '1' ? 'published' : 'unpublished'} successfully`,
      status: true,
      data: legalContent
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update legal content publish status',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get content by slug (for public access)
const getLegalContentBySlug = async ctx => {
  try {
    const { slug } = ctx.params;

    const legalContent = await LegalContent.findOne({
      where: {
        slug,
        status: '1',
        isPublish: '1'
      }
    });

    if (!legalContent) {
      ctx.status = 404;
      ctx.body = {
        message: 'Legal content not found or not published',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Legal content fetched successfully',
      status: true,
      data: legalContent
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch legal content',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  addLegalContent,
  editLegalContent,
  deleteLegalContent,
  getLegalContentDetail,
  listLegalContent,
  updateLegalContentStatus,
  updateLegalContentPublish,
  getLegalContentBySlug
};
