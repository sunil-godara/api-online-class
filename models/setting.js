'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Setting extends Model {
    static associate() {
      // define associations here if needed in the future
    }
  }

  Setting.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      title: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      configValue: {
        type: DataTypes.STRING(255),
        allowNull: true
      },
      field_type: {
        type: DataTypes.ENUM('numeric', 'date', 'string', 'image', 'email', 'boolean', 'textarea', 'select'),
        allowNull: false,
        defaultValue: 'string'
      }
    },
    {
      sequelize,
      modelName: 'Setting',
      tableName: 'settings',
      timestamps: true, // Enables createdAt & updatedAt
      paranoid: true // Enables deletedAt for soft deletes
    }
  );

  return Setting;
};
