'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class LegalContent extends Model {
    static associate() {
      // define associations here if needed in the future
    }
  }

  LegalContent.init(
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
      content: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      version: {
        type: DataTypes.STRING(50),
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1'
      },
      isPublish: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '0'
      }
    },
    {
      sequelize,
      modelName: 'LegalContent',
      tableName: 'legal_contents',
      timestamps: true, // Enables createdAt & updatedAt
      paranoid: true // Enables deletedAt for soft deletes
    }
  );

  return LegalContent;
};
