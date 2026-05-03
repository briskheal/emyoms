const db = require('../models');

async function checkNotes() {
    try {
        const items = await db.NoteItem.findAll({
            where: { gstPercent: 12 }
        });
        console.log(`Found ${items.length} financial note items with 12% GST.`);
        
        const noteIds = [...new Set(items.map(item => item.financialNoteId))];
        for (const id of noteIds) {
            console.log(`- Financial Note ID: ${id}`);
        }
    } catch (error) {
        console.error('Error checking Notes:', error);
    } finally {
        await db.sequelize.close();
    }
}

checkNotes();
