const { Sequelize } = require("sequelize");

module.exports = new Sequelize("db_name", "db_username", "db_pass", {
  host: "db_host",
  dialect: "mysql",
});
