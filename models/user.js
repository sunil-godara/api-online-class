'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    static associate(models) {
      // define associations here
      User.hasMany(models.Booking, {
        foreignKey: 'userId',
        as: 'bookings'
      });
      User.hasMany(models.Class, {
        foreignKey: 'practitionerId',
        as: 'classes'
      });
      User.hasOne(models.PractitionerProfile, {
        foreignKey: 'userId',
        as: 'practitionerProfile'
      });
      User.hasMany(models.PractitionerModality, {
        foreignKey: 'practitionerId',
        as: 'practitionerModalities'
      });
    }
  }

  User.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: DataTypes.STRING,
      email: DataTypes.STRING,
      phone: DataTypes.STRING,
      zipCode: DataTypes.STRING,
      password: DataTypes.STRING,
      social_provider: DataTypes.STRING,
      profile_photo_url: DataTypes.TEXT,
      preferred_location: DataTypes.STRING,
      is_practitioner: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      is_admin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      access_token: DataTypes.TEXT,
      remember_me: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1'
      },
      reason: DataTypes.TEXT,
      reset_password_token: DataTypes.TEXT,
      device_id: DataTypes.STRING,
      device_token: DataTypes.TEXT,
      latitude: DataTypes.STRING,
      longitude: DataTypes.STRING,
      email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      phone_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      email_verification_token: DataTypes.TEXT,
      phone_verification_token: DataTypes.STRING,
      accepted_terms: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      accepted_privacy_policy: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      },
      accepted_waiver_agreement: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
      }
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      // underscored: true, // Converts camelCase to snake_case
      timestamps: true, // Enables createdAt & updatedAt
      paranoid: true // Enables deletedAt
    }
  );

  return User;
};
