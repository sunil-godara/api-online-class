'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Booking extends Model {
    static associate(models) {
      // define associations here
      Booking.belongsTo(models.Class, {
        foreignKey: 'classId',
        as: 'class'
      });
      Booking.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
      Booking.hasOne(models.Payment, {
        foreignKey: 'bookingId',
        as: 'payment'
      });
    }
  }

  Booking.init(
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
      userId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      seatsBooked: DataTypes.INTEGER,
      amountPaid: DataTypes.DECIMAL(10, 2),
      status: {
        type: DataTypes.STRING(50),
        defaultValue: 'booked'
      },
      bookingTime: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
      },
      referralCodeUsed: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'Booking',
      tableName: 'bookings',
      timestamps: true,
      paranoid: true
    }
  );

  return Booking;
};
