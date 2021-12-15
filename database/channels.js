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
        name: { type: DataTypes.STRING },
        id: { type: DataTypes.STRING },
        createdId: { type: DataTypes.STRING },
        type: { type: DataTypes.STRING },
      },
      {
        tableName: "channels",
        timestamps: true,
        sequelize,
      }
    );
  }
};
