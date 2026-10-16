'use strict';
const bcrypt = require('bcryptjs');
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log(Sequelize);
    const hashedPassword1 = await bcrypt.hash('admin@123', 10);

    return queryInterface.bulkInsert(
      'users',
      [
        {
          id: 'e4d1a1b4-1cd4-46db-8b70-85fb919b02aa',
          name: 'Admin',
          email: 'sanaraAdmin@yopmail.com',
          phone: '085255662245',
          password: hashedPassword1,
          social_provider: null,
          profile_photo_url: null,
          preferred_location: null,
          is_practitioner: false,
          is_admin: true,
          access_token: null,
          remember_me: false,
          status: '1',
          reset_password_token: null
        }
      ],
      {}
    );
  },

  async down(queryInterface, Sequelize) {
    console.log(Sequelize);
    return queryInterface.bulkDelete('users', null, {});
  }
};
