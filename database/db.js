const { Sequelize } = require("sequelize");

module.exports = new Sequelize("db_name", "root", "", {
  host: "localhost",
  dialect: "mysql",
});
