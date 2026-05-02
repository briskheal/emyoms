const db = require('./models');
const dotenv = require('dotenv');
dotenv.config();

async function checkGlobalMasters() {
    try {
        await db.sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL');

        const company = await db.Company.findOne();
        console.log('\n--- Company / Multimedia Details ---');
        if (company) {
            console.log(`Name: ${company.name}`);
            console.log(`Music URL: ${company.musicUrl || 'MISSING'}`);
            console.log(`Video URL: ${company.videoUrl || 'MISSING'}`);
            console.log(`Music Volume: ${company.musicVolume}`);
        } else {
            console.log('❌ No Company data found!');
        }

        const counts = {
            Categories: await db.Category.count(),
            Groups: await db.Group.count(),
            HSNs: await db.HSN.count(),
            GSTs: await db.GST.count(),
            HQs: await db.HQ.count(),
            ExpenseCategories: await db.ExpenseCategory.count()
        };

        console.log('\n--- Global Master Counts ---');
        console.log(JSON.stringify(counts, null, 2));

        if (counts.Categories > 0) {
            const cats = await db.Category.findAll({ limit: 5 });
            console.log('\nSample Categories:', cats.map(c => c.name).join(', '));
        }
        
        if (counts.HSNs > 0) {
            const hsns = await db.HSN.findAll({ limit: 5 });
            console.log('Sample HSNs:', hsns.map(h => h.code).join(', '));
        }

        if (counts.HQs > 0) {
            const hqs = await db.HQ.findAll({ limit: 5 });
            console.log('Sample HQs:', hqs.map(h => h.name).join(', '));
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkGlobalMasters();
