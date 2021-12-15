const { DataTypes, Model } = require("sequelize");

module.exports = class config extends Model {
  static init(sequelize) {
    return super.init(
      {
        configId: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        categoryID: { type: DataTypes.STRING },
        categoryName: { type: DataTypes.STRING },
        channelID: { type: DataTypes.STRING },
        channelName: { type: DataTypes.STRING },
        content: { type: DataTypes.STRING },
        attachments: { type: DataTypes.STRING },
        author: { type: DataTypes.STRING },
      },
      {
        tableName: "messages",
        timestamps: true,
        sequelize,
      }
    );
  }
};
