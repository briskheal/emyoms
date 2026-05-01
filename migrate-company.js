const mongoose = require('mongoose');
const db = require('./models');

async function migrateCompanyData() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        const MongoCompany = mongoose.model('Company', new mongoose.Schema({}, { strict: false }));
        const mongoComp = await MongoCompany.findOne();
        
        if (!mongoComp) {
            console.error('No company data found in MongoDB');
            process.exit(1);
        }

        const data = mongoComp.toObject();
        
        // Prepare combined bank details
        const bankDetails = `A/C: ${data.bankAccountNo || ''}\nIFSC: ${data.bankIfsc || ''}\nUPI: ${data.upiId || ''}`.trim();

        // Prepare document counters
        const documentCounters = {
            invoice: { prefix: 'EMY-INV-202605-', nextNumber: 1 },
            purchase: { prefix: 'EMY-PUR-202605-', nextNumber: 1 },
            lossCn: { prefix: 'EB-CN-202605-', nextNumber: 1 },
            lossDn: { prefix: 'PD-DN-202605-', nextNumber: 1 }
        };

        // If you want to continue from MongoDB numbers:
        // Invoice was 13 -> next is 14
        // Purchase was 2 -> next is 3
        // CN was 1 -> next is 2
        // DN was 1 -> next is 2
        documentCounters.invoice.nextNumber = 14;
        documentCounters.purchase.nextNumber = 3;
        documentCounters.lossCn.nextNumber = 2;
        documentCounters.lossDn.nextNumber = 2;

        const updateData = {
            name: data.name,
            address: data.address,
            websites: data.websites || [],
            phones: data.phones || [],
            tollFree: data.tollFree,
            emails: data.emails || [],
            superDistributorEmail: data.superDistributorEmail,
            adminEmail: data.adminEmail,
            gstRate: data.gstRate,
            state: data.state,
            gstNo: data.gstNo,
            panNo: data.panNo,
            dlNo: data.dlNo,
            fssaiNo: data.fssaiNo,
            bankDetails: bankDetails,
            termsConditions: data.termsConditions,
            invoiceTerms: data.invoiceTerms,
            cnTerms: data.cnTerms,
            dnTerms: data.dnTerms,
            invoiceBankVisible: data.invoiceBankVisible,
            scrollingMessage: data.scrollingMessage || {},
            invoiceStyle: data.invoiceStyle || 'classic',
            documentCounters: documentCounters,
            musicUrl: data.musicUrl,
            videoUrl: data.videoUrl,
            musicVolume: data.musicVolume
        };

        let sqlComp = await db.Company.findOne();
        if (sqlComp) {
            await sqlComp.update(updateData);
            console.log('✅ PostgreSQL Company Data Updated Successfully');
        } else {
            await db.Company.create(updateData);
            console.log('✅ PostgreSQL Company Data Created Successfully');
        }

        process.exit(0);
    } catch (e) {
        console.error('Error:', e);
        process.exit(1);
    }
}

migrateCompanyData();
