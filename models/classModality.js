'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassModality extends Model {
    static associate(models) {
      // define associations here
      ClassModality.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
      ClassModality.belongsTo(models.Modality, {
        foreignKey: 'modalityId',
        as: 'modality'
      });
    }
  }

  ClassModality.init(
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
      modalityId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'ClassModality',
      tableName: 'class_modalities',
      timestamps: true
    }
  );

  return ClassModality;
};
