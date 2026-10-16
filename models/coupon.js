'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Coupon extends Model {
    static associate() {
      // No direct associations
    }
  }

  Coupon.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      code: DataTypes.STRING(50),
      type: DataTypes.STRING(50),
      amount: DataTypes.DECIMAL(10, 2),
      isPercentage: DataTypes.BOOLEAN,
      maxUsage: DataTypes.INTEGER,
      expiresAt: DataTypes.DATEONLY,
      usedCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0
      }
    },
    {
      sequelize,
      modelName: 'Coupon',
      tableName: 'coupons',
      timestamps: true,
      paranoid: true
    }
  );

  return Coupon;
};
