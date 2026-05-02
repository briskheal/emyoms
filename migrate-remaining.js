const mongoose = require('mongoose');
const db = require('./models');

async function migrateRemaining() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        const sqlStockists = await db.Stockist.findAll();
        const stockistMap = {};
        sqlStockists.forEach(s => stockistMap[s.loginId] = s.id);

        // --- MIGRATE PURCHASE ENTRIES ---
        const MongoPurchase = mongoose.model('PurchaseEntry', new mongoose.Schema({}, { strict: false }));
        const mongoPurchases = await MongoPurchase.find();
        console.log(`🔄 Migrating ${mongoPurchases.length} Purchase Entries...`);

        for (const mp of mongoPurchases) {
            const data = mp.toObject();
            const supplierId = stockistMap[data.supplierCode];
            
            await db.PurchaseEntry.findOrCreate({
                where: { purchaseNo: data.purchaseNo },
                defaults: {
                    purchaseNo: data.purchaseNo,
                    supplierId: supplierId,
                    supplierInvoiceNo: data.supplierInvoiceNo,
                    invoiceDate: data.invoiceDate,
                    subTotal: data.subTotal || 0,
                    gstAmount: data.gstAmount || 0,
                    grandTotal: data.grandTotal || 0,
                    remarks: data.remarks || '',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                }
            });
        }

        // --- FINAL CHECK ON PRODUCTS ---
        // Ensuring all fields are updated
        const MongoProduct = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const mongoProducts = await MongoProduct.find();
        console.log(`🔄 Syncing ${mongoProducts.length} Products...`);

        for (const mp of mongoProducts) {
            const data = mp.toObject();
            const sqlProd = await db.Product.findOne({ where: { name: data.name } });
            if (sqlProd) {
                await sqlProd.update({
                    manufacturer: data.manufacturer || '',
                    hsn: data.hsn || '',
                    category: data.category || '',
                    group: data.group || '',
                    packing: data.packing || '',
                    mrp: data.mrp || 0,
                    ptr: data.ptr || 0,
                    pts: data.pts || 0,
                    gstPercent: data.gstPercent || 12,
                    qtyAvailable: data.qtyAvailable || 0,
                    active: data.active !== undefined ? data.active : true,
                    bonusBuy: data.bonusScheme ? data.bonusScheme.buy : 0,
                    bonusGet: data.bonusScheme ? data.bonusScheme.get : 0
                });
            } else {
                await db.Product.create({
                    name: data.name,
                    manufacturer: data.manufacturer || '',
                    hsn: data.hsn || '',
                    category: data.category || '',
                    group: data.group || '',
                    packing: data.packing || '',
                    mrp: data.mrp || 0,
                    ptr: data.ptr || 0,
                    pts: data.pts || 0,
                    gstPercent: data.gstPercent || 12,
                    qtyAvailable: data.qtyAvailable || 0,
                    active: data.active !== undefined ? data.active : true,
                    bonusBuy: data.bonusScheme ? data.bonusScheme.buy : 0,
                    bonusGet: data.bonusScheme ? data.bonusScheme.get : 0
                });
            }
        }

        console.log('✅ Remaining Data Migration Completed!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration Error:', e);
        process.exit(1);
    }
}

migrateRemaining();
