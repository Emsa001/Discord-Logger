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
        servsers: { type: DataTypes.INTEGER },
      },
      {
        tableName: "adminsettings",
        timestamps: true,
        sequelize,
      }
    );
  }
};
