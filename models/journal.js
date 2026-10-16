'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Journal extends Model {
    static associate(models) {
      Journal.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Journal.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
    }
  }

  Journal.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      classId: {
        type: DataTypes.UUID,
        allowNull: true
      },
      entryText: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'Journal',
      tableName: 'journals',
      timestamps: true,
      paranoid: true
    }
  );

  return Journal;
};
