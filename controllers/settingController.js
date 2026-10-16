require('dotenv').config();
const db = require('../models');
const Setting = db.Setting;

// Add Setting
const addSetting = async ctx => {
  try {
    const { title, slug, configValue, field_type } = ctx.request.body;

    // Validate required fields
    if (!title || !slug || !field_type) {
      ctx.status = 400;
      ctx.body = {
        message: 'Title, slug, and field_type are required',
        status: false,
        data: null
      };
      return;
    }

    // Validate slug uniqueness
    const existingSetting = await Setting.findOne({
      where: { slug }
    });

    if (existingSetting) {
      ctx.status = 400;
      ctx.body = {
        message: 'Slug must be unique',
        status: false,
        data: null
      };
      return;
    }

    // Validate field_type values
    const validFieldTypes = ['numeric', 'date', 'string', 'image', 'email', 'boolean', 'textarea', 'select'];
    if (!validFieldTypes.includes(field_type)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid field_type. Must be one of: numeric, date, string, image, email, boolean, textarea, select',
        status: false,
        data: null
      };
      return;
    }

    // Create new setting
    const newSetting = await Setting.create({
      title,
      slug,
      configValue: configValue || '',
      field_type
    });

    ctx.status = 201;
    ctx.body = {
      message: 'Setting created successfully',
      status: true,
      data: newSetting
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to create setting',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Edit Setting
const editSetting = async ctx => {
  try {
    const { id, title, configValue, field_type } = ctx.request.body;

    // Validate required fields
    if (!id || !title || !field_type) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID, title, and field_type are required',
        status: false,
        data: null
      };
      return;
    }

    // Find the setting
    const setting = await Setting.findByPk(id);
    if (!setting) {
      ctx.status = 404;
      ctx.body = {
        message: 'Setting not found',
        status: false,
        data: null
      };
      return;
    }

    // Validate field_type values
    const validFieldTypes = ['numeric', 'date', 'string', 'image', 'email', 'boolean', 'textarea', 'select'];
    if (!validFieldTypes.includes(field_type)) {
      ctx.status = 400;
      ctx.body = {
        message: 'Invalid field_type. Must be one of: numeric, date, string, image, email, boolean, textarea, select',
        status: false,
        data: null
      };
      return;
    }

    // Update the setting (slug is not editable)
    await setting.update({
      title,
      configValue: configValue !== undefined ? configValue : setting.configValue,
      field_type
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Setting updated successfully',
      status: true,
      data: setting
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update setting',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Delete Setting (Soft Delete)
const deleteSetting = async ctx => {
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

    const setting = await Setting.findByPk(id);
    if (!setting) {
      ctx.status = 404;
      ctx.body = {
        message: 'Setting not found',
        status: false,
        data: null
      };
      return;
    }

    // Soft delete
    await setting.destroy();

    ctx.status = 200;
    ctx.body = {
      message: 'Setting deleted successfully',
      status: true,
      data: null
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to delete setting',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// View Setting Detail
const getSettingDetail = async ctx => {
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

    const setting = await Setting.findByPk(id);
    if (!setting) {
      ctx.status = 404;
      ctx.body = {
        message: 'Setting not found',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Setting fetched successfully',
      status: true,
      data: setting
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch setting',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// List Settings
const listSettings = async ctx => {
  try {
    const { field_type } = ctx.query;

    // Build where clause
    const whereClause = {};

    if (field_type) {
      whereClause.field_type = field_type;
    }

    // Fetch all settings
    const settings = await Setting.findAll({
      where: whereClause,
      order: [['title', 'DESC']]
    });

    ctx.status = 200;
    ctx.body = {
      message: 'Settings list fetched successfully',
      status: true,
      data: settings
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch settings list',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Get setting by slug (for public access)
const getSettingBySlug = async ctx => {
  try {
    const { slug } = ctx.params;

    const setting = await Setting.findOne({
      where: { slug }
    });

    if (!setting) {
      ctx.status = 404;
      ctx.body = {
        message: 'Setting not found',
        status: false,
        data: null
      };
      return;
    }

    ctx.status = 200;
    ctx.body = {
      message: 'Setting fetched successfully',
      status: true,
      data: setting
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to fetch setting',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

// Update setting value only
const updateSettingValue = async ctx => {
  try {
    const { id, configValue } = ctx.request.body;

    // Validate required fields
    if (!id || configValue === undefined) {
      ctx.status = 400;
      ctx.body = {
        message: 'ID and configValue are required',
        status: false,
        data: null
      };
      return;
    }

    const setting = await Setting.findByPk(id);
    if (!setting) {
      ctx.status = 404;
      ctx.body = {
        message: 'Setting not found',
        status: false,
        data: null
      };
      return;
    }

    await setting.update({ configValue });

    ctx.status = 200;
    ctx.body = {
      message: 'Setting value updated successfully',
      status: true,
      data: setting
    };
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = {
      message: 'Failed to update setting value',
      status: false,
      data: err.message || 'An error occurred'
    };
  }
};

module.exports = {
  addSetting,
  editSetting,
  deleteSetting,
  getSettingDetail,
  listSettings,
  getSettingBySlug,
  updateSettingValue
};
