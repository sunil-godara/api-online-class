'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Class extends Model {
    static associate(models) {
      // define associations here
      Class.belongsTo(models.User, {
        foreignKey: 'practitionerId',
        as: 'practitioner'
      });
      Class.belongsTo(models.Studio, {
        foreignKey: 'studioId',
        as: 'studio'
      });
      Class.belongsTo(models.StudioRoom, {
        foreignKey: 'roomId',
        as: 'room'
      });
      Class.hasMany(models.ClassModality, {
        foreignKey: 'classId',
        as: 'classModalities'
      });
      Class.hasMany(models.ClassRepeat, {
        foreignKey: 'classId',
        as: 'repeats'
      });
      Class.hasMany(models.Booking, {
        foreignKey: 'classId',
        as: 'bookings'
      });
      Class.hasMany(models.Review, {
        foreignKey: 'classId',
        as: 'reviews'
      });
      Class.hasMany(models.Journal, {
        foreignKey: 'classId',
        as: 'journals'
      });
      Class.hasMany(models.ClassRecommendation, {
        foreignKey: 'classId',
        as: 'recommendations'
      });
    }
  }

  Class.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      practitionerId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      studioId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      roomId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      title: DataTypes.STRING(255),
      description: DataTypes.TEXT,
      tags: DataTypes.TEXT,
      location: DataTypes.TEXT,
      dateTime: DataTypes.DATE,
      durationMins: DataTypes.INTEGER,
      endTime: {
        type: DataTypes.DATE,
        allowNull: true
      },
      capacity: DataTypes.INTEGER,
      price: DataTypes.DECIMAL(10, 2),
      resourceLinks: DataTypes.TEXT,
      approvalStatus: DataTypes.STRING(50),
      commissionRateOverride: DataTypes.DECIMAL(5, 2)
    },
    {
      sequelize,
      modelName: 'Class',
      tableName: 'classes',
      timestamps: true,
      paranoid: true
    }
  );

  return Class;
};
