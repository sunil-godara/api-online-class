'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Referral extends Model {
    static associate(models) {
      Referral.belongsTo(models.User, {
        foreignKey: 'referrerUserId',
        as: 'referrer'
      });
      Referral.belongsTo(models.User, {
        foreignKey: 'referredUserId',
        as: 'referred'
      });
    }
  }

  Referral.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      referrerUserId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      referredUserId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      rewardStatus: DataTypes.STRING(50),
      rewardAmount: DataTypes.DECIMAL(10, 2)
    },
    {
      sequelize,
      modelName: 'Referral',
      tableName: 'referrals',
      timestamps: true,
      paranoid: true
    }
  );

  return Referral;
};
