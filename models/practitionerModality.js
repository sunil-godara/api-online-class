'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class PractitionerModality extends Model {
    static associate(models) {
      // define associations here
      PractitionerModality.belongsTo(models.User, {
        foreignKey: 'practitionerId',
        as: 'practitioner'
      });
      PractitionerModality.belongsTo(models.Modality, {
        foreignKey: 'modalityId',
        as: 'modality'
      });
    }
  }

  PractitionerModality.init(
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
      modalityId: {
        type: DataTypes.UUID,
        allowNull: false
      }
    },
    {
      sequelize,
      modelName: 'PractitionerModality',
      tableName: 'practitioner_modalities',
      timestamps: true
    }
  );

  return PractitionerModality;
};
