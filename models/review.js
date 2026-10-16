'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Review extends Model {
    static associate(models) {
      Review.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Review.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
    }
  }

  Review.init(
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
      rating: DataTypes.INTEGER,
      comment: DataTypes.TEXT,
      status: DataTypes.STRING(50)
    },
    {
      sequelize,
      modelName: 'Review',
      tableName: 'reviews',
      timestamps: true,
      paranoid: true
    }
  );

  return Review;
};
