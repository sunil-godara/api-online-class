'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payout extends Model {
    static associate(models) {
      Payout.belongsTo(models.User, {
        foreignKey: 'practitionerId',
        as: 'practitioner'
      });
    }
  }

  Payout.init(
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
      amount: DataTypes.DECIMAL(10, 2),
      payoutDate: DataTypes.DATEONLY,
      relatedBookingIds: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'Payout',
      tableName: 'payouts',
      timestamps: true,
      paranoid: true
    }
  );

  return Payout;
};
