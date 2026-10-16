'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class ClassRecommendation extends Model {
    static associate(models) {
      ClassRecommendation.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      ClassRecommendation.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
    }
  }

  ClassRecommendation.init(
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
        allowNull: false
      },
      source: DataTypes.STRING(100)
    },
    {
      sequelize,
      modelName: 'ClassRecommendation',
      tableName: 'class_recommendations',
      timestamps: true,
      paranoid: true
    }
  );

  return ClassRecommendation;
};
