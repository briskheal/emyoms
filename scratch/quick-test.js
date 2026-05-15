const { Sequelize } = require('sequelize');
const NEON_HOST = "ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech";
const NEON_IP = "13.251.17.193";
const NEON_USER = "neondb_owner";
const NEON_PASS = "npg_bqJ3wQE8GWuX";
const NEON_DB = "neondb";

console.log("Starting connection test...");
const sequelize = new Sequelize(`postgresql://${NEON_USER}:${NEON_PASS}@${NEON_IP}/${NEON_DB}`, {
    dialect: 'postgres',
    logging: console.log,
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false,
            servername: NEON_HOST,
            checkServerIdentity: () => undefined
        }
    }
});

sequelize.authenticate()
    .then(() => {
        console.log("✅ CONNECTED SUCCESSFULLY");
        process.exit(0);
    })
    .catch(err => {
        console.error("❌ CONNECTION FAILED:", err);
        process.exit(1);
    });
