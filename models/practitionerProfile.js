'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PractitionerProfile extends Model {
    static associate(models) {
      // define associations here
      PractitionerProfile.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  PractitionerProfile.init(
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
      bio: DataTypes.TEXT,
      certifications: DataTypes.TEXT,
      stripeConnectId: DataTypes.TEXT,
      approvalStatus: {
        type: DataTypes.STRING(50),
        defaultValue: 'pending'
      },
      commissionRate: DataTypes.DECIMAL(5, 2)
    },
    {
      sequelize,
      modelName: 'PractitionerProfile',
      tableName: 'practitioner_profiles',
      timestamps: true,
      paranoid: true
    }
  );

  return PractitionerProfile;
};
