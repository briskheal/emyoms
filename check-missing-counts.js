const mongoose = require('mongoose');

async function checkMissingCounts() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        
        const Expense = mongoose.model('Expense', new mongoose.Schema({}, { strict: false }));
        const expCount = await Expense.countDocuments();
        
        const Purchase = mongoose.model('PurchaseEntry', new mongoose.Schema({}, { strict: false }));
        const purCount = await Purchase.countDocuments();
        
        const Media = mongoose.model('Media', new mongoose.Schema({}, { strict: false }));
        const mediaCount = await Media.countDocuments();

        const FailedEmail = mongoose.model('FailedEmail', new mongoose.Schema({}, { strict: false }));
        const emailCount = await FailedEmail.countDocuments();

        console.log('--- MongoDB Counts ---');
        console.log(`Expenses: ${expCount}`);
        console.log(`Purchase Entries: ${purCount}`);
        console.log(`Media: ${mediaCount}`);
        console.log(`Failed Emails: ${emailCount}`);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

checkMissingCounts();
