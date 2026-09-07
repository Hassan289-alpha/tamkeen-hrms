const { Sequelize } = require("sequelize");

// Test SQL Server connection using Windows Authentication / localhost
const sequelize = new Sequelize("office_attendance", "", "", {
  host: "localhost",
  dialect: "mssql",
  logging: console.log,
  dialectOptions: {
    options: {
      encrypt: false,
      trustServerCertificate: true,
      trustedConnection: true,
      enableArithAbort: true,
    },
  },
});

sequelize
  .authenticate()
  .then(() => {
    console.log("✓ SQL Server Connection Successful!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("✗ SQL Server Connection Failed:", err.message);
    process.exit(1);
  });
