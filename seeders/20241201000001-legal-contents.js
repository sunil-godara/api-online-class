'use strict';
const { v4: uuidv4 } = require('uuid');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert(
      'legal_contents',
      [
        {
          id: uuidv4(),
          title: 'Terms of Service',
          slug: 'terms-of-service',
          content: 'This is the Terms of Service content. Please update this with your actual terms of service.',
          version: 'v1.0',
          status: '1',
          isPublish: '1'
        },
        {
          id: uuidv4(),
          title: 'Privacy Policy',
          slug: 'privacy-policy',
          content: 'This is the Privacy Policy content. Please update this with your actual privacy policy.',
          version: 'v1.0',
          status: '1',
          isPublish: '1'
        },
        {
          id: uuidv4(),
          title: 'Waiver Document',
          slug: 'waiver-document',
          content: 'This is the Waiver Document content. Please update this with your actual waiver agreement.',
          version: 'v1.0',
          status: '1',
          isPublish: '1'
        }
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('legal_contents', null, {});
  }
};
