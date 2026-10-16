'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'settings',
      [
        {
          id: uuidv4(),
          title: 'System Application Name',
          slug: 'SYSTEM_APPLICATION_NAME',
          configValue: 'Sanara Wellness',
          field_type: 'string'
        },
        {
          id: uuidv4(),
          title: 'System Application Description',
          slug: 'SYSTEM_APPLICATION_DESCRIPTION',
          configValue: 'Your wellness journey starts here',
          field_type: 'textarea'
        },
        {
          id: uuidv4(),
          title: 'System Application Email',
          slug: 'SYSTEM_APPLICATION_EMAIL',
          configValue: 'contact@sanara.com',
          field_type: 'email'
        },
        {
          id: uuidv4(),
          title: 'System Application Phone',
          slug: 'SYSTEM_APPLICATION_PHONE',
          configValue: '+1-555-123-4567',
          field_type: 'string'
        },
        {
          id: uuidv4(),
          title: 'System Application Logo',
          slug: 'SYSTEM_APPLICATION_LOGO',
          configValue: '/images/logo.png',
          field_type: 'image'
        },
        {
          id: uuidv4(),
          title: 'System Application Maintenance Mode',
          slug: 'SYSTEM_APPLICATION_MAINTENANCE_MODE',
          configValue: 'false',
          field_type: 'boolean'
        },
        {
          id: uuidv4(),
          title: 'Admin Page Limit',
          slug: 'ADMIN_PAGE_LIMIT',
          configValue: '10',
          field_type: 'numeric'
        },
        {
          id: uuidv4(),
          title: 'Default Currency',
          slug: 'DEFAULT_CURRENCY',
          configValue: 'USD',
          field_type: 'string'
        }
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('settings', null, {});
  }
};
