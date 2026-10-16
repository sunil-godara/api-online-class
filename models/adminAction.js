'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AdminAction extends Model {
    static associate(models) {
      AdminAction.belongsTo(models.User, {
        foreignKey: 'adminId',
        as: 'admin'
      });
    }
  }

  AdminAction.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      adminId: {
        type: DataTypes.UUID,
        allowNull: false
      },
      actionType: DataTypes.STRING(100),
      targetType: DataTypes.STRING(100),
      targetId: DataTypes.INTEGER,
      reason: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'AdminAction',
      tableName: 'admin_actions',
      timestamps: true,
      paranoid: true
    }
  );

  return AdminAction;
};
