'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Studio extends Model {
    static associate(models) {
      // define associations here
      Studio.belongsTo(models.User, {
        foreignKey: 'createdBy',
        as: 'creator'
      });
      Studio.hasMany(models.StudioRoom, {
        foreignKey: 'studioId',
        as: 'rooms'
      });
      Studio.hasMany(models.Class, {
        foreignKey: 'studioId',
        as: 'classes'
      });
    }
  }

  Studio.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: DataTypes.STRING(255),
      location: DataTypes.TEXT,
      description: DataTypes.TEXT,
      logoUrl: DataTypes.TEXT,
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true
      },
      approvalStatus: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending'
      }
    },
    {
      sequelize,
      modelName: 'Studio',
      tableName: 'studios',
      timestamps: true,
      paranoid: true
    }
  );

  return Studio;
};
