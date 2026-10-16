'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class Modality extends Model {
    static associate() {
      // define associations here
    }
  }

  Modality.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true
      },
      name: {
        type: DataTypes.STRING(255),
        allowNull: false
      },
      slug: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true
      },
      description: DataTypes.TEXT,
      iconUrl: DataTypes.TEXT,
      status: {
        type: DataTypes.ENUM('0', '1'),
        defaultValue: '1'
      }
    },
    {
      sequelize,
      modelName: 'Modality',
      tableName: 'modalities',
      timestamps: true,
      paranoid: true
    }
  );

  return Modality;
};
