'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassRepeat extends Model {
    static associate(models) {
      // define associations here
      ClassRepeat.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
    }
  }

  ClassRepeat.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      classId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      recurrencePattern: DataTypes.STRING(100),
      dayOfWeek: DataTypes.STRING(20),
      endDate: DataTypes.DATEONLY
    },
    {
      sequelize,
      modelName: 'ClassRepeat',
      tableName: 'class_repeats',
      timestamps: true,
      paranoid: true
    }
  );

  return ClassRepeat;
};
