'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('users', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4
      },
      name: {
        type: Sequelize.STRING
      },
      email: {
        type: Sequelize.STRING
      },
      phone: {
        allowNull: true,
        type: Sequelize.STRING
      },
      zipCode: {
        allowNull: true,
        type: Sequelize.STRING
      },
      password: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: null
      },
      social_provider: {
        allowNull: true,
        type: Sequelize.STRING
      },
      profile_photo_url: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      preferred_location: {
        allowNull: true,
        type: Sequelize.STRING
      },
      is_practitioner: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      is_admin: {
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      access_token: {
        allowNull: true,
        type: Sequelize.TEXT,
        defaultValue: null
      },
      remember_me: {
        allowNull: false,
        type: Sequelize.BOOLEAN,
        defaultValue: false
      },
      status: {
        allowNull: false,
        type: Sequelize.ENUM('0', '1'),
        defaultValue: '1'
      },
      reset_password_token: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      reason: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      device_id: {
        allowNull: true,
        type: Sequelize.STRING
      },
      device_token: {
        allowNull: true,
        type: Sequelize.TEXT
      },
      latitude: {
        allowNull: true,
        type: Sequelize.STRING
      },
      longitude: {
        allowNull: true,
        type: Sequelize.STRING
      },
      email_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      phone_verified: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      email_verification_token: {
        allowNull: true,
        type: Sequelize.TEXT,
        defaultValue: null
      },
      phone_verification_token: {
        allowNull: true,
        type: Sequelize.STRING,
        defaultValue: null
      },
      accepted_terms: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      accepted_privacy_policy: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      accepted_waiver_agreement: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      createdAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: {
        allowNull: true,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      deletedAt: {
        allowNull: true,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    console.log('Sequelize', Sequelize);
    await queryInterface.dropTable('users');
  }
};
