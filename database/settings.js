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
        rcon_host: { type: DataTypes.STRING },
        rcon_port: { type: DataTypes.INTEGER },
        rcon_password: { type: DataTypes.STRING },
        consoleChat: { type: DataTypes.STRING },
        guildId: { type: DataTypes.STRING },
      },
      {
        tableName: "settings",
        timestamps: true,
        sequelize,
      }
    );
  }
};
