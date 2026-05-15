const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();

const NEON_HOST = "ep-green-mountain-aonjketm-pooler.c-2.ap-southeast-1.aws.neon.tech";
const NEON_IP = "13.251.17.193";
const NEON_USER = "neondb_owner";
const NEON_PASS = "npg_bqJ3wQE8GWuX";
const NEON_DB = "neondb";

async function test() {
    console.log(`Connecting to ${NEON_IP} with SNI ${NEON_HOST}...`);
    const sequelize = new Sequelize(`postgresql://${NEON_USER}:${NEON_PASS}@${NEON_IP}/${NEON_DB}`, {
        dialect: 'postgres',
        logging: true,
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false,
                servername: NEON_HOST
            }
        }
    });

    try {
        await sequelize.authenticate();
        console.log("✅ SUCCESS!");
        process.exit(0);
    } catch (e) {
        console.error("❌ FAILED:", e.message);
        process.exit(1);
    }
}

test();
