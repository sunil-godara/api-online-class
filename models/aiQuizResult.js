'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class AiQuizResult extends Model {
    static associate(models) {
      AiQuizResult.belongsTo(models.User, {
        foreignKey: 'userId',
        as: 'user'
      });
    }
  }

  AiQuizResult.init(
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
      rawAnswers: DataTypes.JSONB,
      aiRecommendation: DataTypes.JSONB,
      generatedTags: DataTypes.TEXT
    },
    {
      sequelize,
      modelName: 'AiQuizResult',
      tableName: 'ai_quiz_results',
      timestamps: true,
      paranoid: true
    }
  );

  return AiQuizResult;
};
