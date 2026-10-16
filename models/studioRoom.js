'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class StudioRoom extends Model {
    static associate(models) {
      // define associations here
      StudioRoom.belongsTo(models.Studio, {
        foreignKey: 'studioId',
        as: 'studio'
      });
      StudioRoom.hasMany(models.Class, {
        foreignKey: 'roomId',
        as: 'classes'
      });
    }
  }

  StudioRoom.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      studioId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      name: DataTypes.STRING(255),
      capacity: DataTypes.INTEGER
    },
    {
      sequelize,
      modelName: 'StudioRoom',
      tableName: 'studio_rooms',
      timestamps: true,
      paranoid: true
    }
  );

  return StudioRoom;
};
