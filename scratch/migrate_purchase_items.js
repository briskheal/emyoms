const mongoose = require('mongoose');
const db = require('../models');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

async function migratePurchaseEntriesAndItems() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');
        await db.sequelize.authenticate();
        console.log('✅ Connected to PostgreSQL');

        // Maps for stockists and products
        const sqlStockists = await db.Stockist.findAll();
        const stockistMap = {}; // loginId -> id
        sqlStockists.forEach(s => stockistMap[s.loginId] = s.id);
        const stockistNameMap = {}; // name.toUpperCase() -> id
        sqlStockists.forEach(s => stockistNameMap[s.name.toUpperCase()] = s.id);

        const sqlProducts = await db.Product.findAll();
        const productMap = {}; // name.toUpperCase() -> id
        sqlProducts.forEach(p => productMap[p.name.toUpperCase()] = p.id);

        const mongoPurchases = await mongoose.connection.db.collection('purchaseentries').find().toArray();
        console.log(`\nFound ${mongoPurchases.length} Purchase Entries in MongoDB.`);

        for (const mp of mongoPurchases) {
            let purchaseNo = mp.purchaseNo;
            if (!purchaseNo) {
                // If purchaseNo is missing, it's the specific record:
                if (mp._id.toString() === '69ec95b64f770eb0e57f7fa1') {
                    purchaseNo = 'EMY-PUR-20260425-0001';
                    console.log(`  * Assigning purchaseNo '${purchaseNo}' to missing record (ID: ${mp._id})`);
                } else {
                    console.log(`  ! Skipping record without purchaseNo (ID: ${mp._id})`);
                    continue;
                }
            }

            const supplierId = stockistMap[mp.supplierCode] || stockistNameMap[mp.supplierName ? mp.supplierName.toUpperCase() : ''];

            // Find or create purchase entry
            let [sqlEntry, created] = await db.PurchaseEntry.findOrCreate({
                where: { purchaseNo },
                defaults: {
                    purchaseNo,
                    supplierId,
                    supplierInvoiceNo: mp.supplierInvoiceNo || '',
                    invoiceDate: mp.invoiceDate,
                    subTotal: mp.subTotal || 0,
                    gstAmount: mp.gstAmount || 0,
                    grandTotal: mp.grandTotal || 0,
                    remarks: mp.remarks || '',
                    createdAt: mp.createdAt,
                    updatedAt: mp.updatedAt
                }
            });

            if (!created) {
                console.log(`  - Purchase Entry ${purchaseNo} already exists, updating...`);
                await sqlEntry.update({
                    supplierId,
                    supplierInvoiceNo: mp.supplierInvoiceNo || '',
                    invoiceDate: mp.invoiceDate,
                    subTotal: mp.subTotal || 0,
                    gstAmount: mp.gstAmount || 0,
                    grandTotal: mp.grandTotal || 0,
                    remarks: mp.remarks || '',
                    createdAt: mp.createdAt,
                    updatedAt: mp.updatedAt
                });
            } else {
                console.log(`  + Created Purchase Entry ${purchaseNo}`);
            }

            // Clean existing items in SQL for this purchase to prevent duplicate item insertions
            await db.PurchaseItem.destroy({ where: { purchaseEntryId: sqlEntry.id } });

            if (mp.items && Array.isArray(mp.items)) {
                console.log(`    Migrating ${mp.items.length} items for ${purchaseNo}...`);
                for (const item of mp.items) {
                    const productId = productMap[item.name.toUpperCase()];
                    if (!productId) {
                        console.log(`    ⚠️ Product not found in SQL for item: "${item.name}"`);
                    }
                    await db.PurchaseItem.create({
                        purchaseEntryId: sqlEntry.id,
                        productId,
                        name: item.name,
                        manufacturer: item.manufacturer || '',
                        batch: item.batch || '',
                        mfgDate: item.mfgDate || '',
                        expDate: item.expDate || '',
                        qty: item.qty || 0,
                        bonusQty: item.bonusQty || 0,
                        purchaseRate: item.purchaseRate || 0,
                        mrp: item.mrp || 0,
                        ptr: item.ptr || 0,
                        pts: item.pts || 0,
                        gstPercent: item.gstPercent || 0,
                        hsn: item.hsn || '',
                        totalValue: item.totalValue || 0
                    });
                }
            }
        }

        console.log('\n✅ Purchase entries and nested items successfully migrated!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Error migrating purchase data:', e);
        process.exit(1);
    }
}

migratePurchaseEntriesAndItems();
