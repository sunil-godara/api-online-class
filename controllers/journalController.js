require('dotenv').config();
const db = require('../models');
const Journal = db.Journal;
const User = db.User;
const Class = db.Class;

// Create Journal Entry
const createJournalEntry = async ctx => {
  try {
    const { entryText, classId } = ctx.request.body;
    const userId = ctx.customData.id;

    // Validate required fields
    if (!entryText) {
      ctx.status = 400;
      ctx.body = {
        message: 'Entry text is required',
        status: false,
        data: null
      };
      return;
    }

    // Validate classId if provided
    if (classId) {
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        ctx.status = 400;
        ctx.body = {
          message: 'Invalid class ID',
          status: false,
          data: null
        };
        return;
      }
    }

    // Create new journal entry
    const newEntry = await Journal.create({
      userId,
      classId: classId || null,
      entryText
    });

    // Fetch the created entry with user and class associations
    const createdEntry = await Journal.findByPk(newEntry.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    ctx.status = 201;
    ctx.body = {
      message: 'Journal entry created successfully',
      status: true,
      data: createdEntry
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create journal entry',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// List Journal Entries (for authenticated user only)
const listJournalEntries = async ctx => {
  try {
    const userId = ctx.customData.id;
    const { page = 1, limit = 10, classId } = ctx.query;

    // Build where clause
    const whereClause = { userId };
    if (classId) {
      whereClause.classId = classId;
    }

    // Calculate pagination
    const offset = (page - 1) * limit;

    // Fetch journal entries with pagination
    const { count, rows: entries } = await Journal.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'title', 'description']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const totalPages = Math.ceil(count / limit);

    ctx.status = 200;
    ctx.body = {
      message: 'Journal entries retrieved successfully',
      status: true,
      data: {
        entries,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalEntries: count,
          entriesPerPage: parseInt(limit)
        }
      }
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to retrieve journal entries',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get Single Journal Entry
const getJournalEntry = async ctx => {
  try {
    const { id } = ctx.request.body;
    const userId = ctx.customData.id;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Journal entry ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find journal entry and ensure it belongs to the authenticated user
    const entry = await Journal.findOne({
      where: { id, userId },
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    if (!entry) {
      ctx.status = 404;
      ctx.body = {
        message: 'Journal entry not found or access denied',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Journal entry retrieved successfully',
      status: true,
      data: entry
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to retrieve journal entry',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit Journal Entry
const editJournalEntry = async ctx => {
  try {
    const { id, entryText, classId } = ctx.request.body;
    const userId = ctx.customData.id;

    // Validate required fields
    if (!id || !entryText) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID and entry text are required',
        status: false,
        data: null
      };
      return;
    }

    // Find journal entry and ensure it belongs to the authenticated user
    const entry = await Journal.findOne({
      where: { id, userId }
    });

    if (!entry) {
      ctx.status = 404;
      ctx.body = {
        message: 'Journal entry not found or access denied',
        status: false,
        data: null
      };
      return;
    }

    // Validate classId if provided
    if (classId) {
      const classExists = await Class.findByPk(classId);
      if (!classExists) {
        ctx.status = 400;
        ctx.body = {
          message: 'Invalid class ID',
          status: false,
          data: null
        };
        return;
      }
    }

    // Update the journal entry
    await entry.update({
      entryText,
      classId: classId !== undefined ? classId : entry.classId
    });

    // Fetch the updated entry with associations
    const updatedEntry = await Journal.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email', 'phone']
        },
        {
          model: Class,
          as: 'class',
          attributes: ['id', 'title', 'description']
        }
      ]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Journal entry updated successfully',
      status: true,
      data: updatedEntry
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update journal entry',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete Journal Entry
const deleteJournalEntry = async ctx => {
  try {
    const { id } = ctx.request.body;
    const userId = ctx.customData.id;

    if (!id) {
      ctx.status = 400;
      ctx.body = {
        message: 'Journal entry ID is required',
        status: false,
        data: null
      };
      return;
    }

    // Find journal entry and ensure it belongs to the authenticated user
    const entry = await Journal.findOne({
      where: { id, userId }
    });

    if (!entry) {
      ctx.status = 404;
      ctx.body = {
        message: 'Journal entry not found or access denied',
        status: false,
        data: null
      };
      return;
    }

    // Soft delete the journal entry
    await entry.destroy();

    ctx.status = 200;
    ctx.body = {
      message: 'Journal entry deleted successfully',
      status: true,
      data: null
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete journal entry',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  createJournalEntry,
  listJournalEntries,
  getJournalEntry,
  editJournalEntry,
  deleteJournalEntry
};
