const db = require('../models');
const { Op } = require('sequelize');

async function checkCategories() {
    try {
        const categories = await db.Category.findAll({
            where: {
                name: {
                    [Op.iLike]: '%12%'
                }
            }
        });
        
        console.log(`Found ${categories.length} categories with "12" in their name.`);
        categories.forEach(c => {
            console.log(`- [${c.id}] ${c.name}`);
        });
    } catch (error) {
        console.error('Error checking categories:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkCategories();
