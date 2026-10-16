'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Payment extends Model {
    static associate(models) {
      // define associations here
      Payment.belongsTo(models.Booking, {
        foreignKey: 'bookingId',
        as: 'booking'
      });
    }
  }

  Payment.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      bookingId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      stripeTxnId: DataTypes.TEXT,
      amount: DataTypes.DECIMAL(10, 2),
      status: DataTypes.STRING(50),
      payoutStatus: DataTypes.STRING(50)
    },
    {
      sequelize,
      modelName: 'Payment',
      tableName: 'payments',
      timestamps: true,
      paranoid: true
    }
  );

  return Payment;
};
