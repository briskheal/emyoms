const mongoose = require('mongoose');
const db = require('./models');

async function migrateRemaining() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');

        // Map Stockists (using name as bridge if id is missing)
        const sqlStockists = await db.Stockist.findAll();
        const stockistNameMap = {};
        sqlStockists.forEach(s => stockistNameMap[s.name.toUpperCase()] = s.id);

        // --- MIGRATE PURCHASE ENTRIES ---
        const MongoPurchase = mongoose.model('PurchaseEntry', new mongoose.Schema({}, { strict: false }));
        const mongoPurchases = await MongoPurchase.find();
        console.log(`🔄 Migrating ${mongoPurchases.length} Purchase Entries...`);

        for (const mp of mongoPurchases) {
            const data = mp.toObject();
            const supplierId = stockistNameMap[data.supplierName ? data.supplierName.toUpperCase() : ''];
            
            if (!data.purchaseNo) continue;

            const [entry, created] = await db.PurchaseEntry.findOrCreate({
                where: { purchaseNo: data.purchaseNo },
                defaults: {
                    purchaseNo: data.purchaseNo,
                    supplierId: supplierId,
                    supplierInvoiceNo: data.supplierInvoiceNo || '',
                    invoiceDate: data.invoiceDate,
                    subTotal: data.subTotal || 0,
                    gstAmount: data.gstAmount || 0,
                    grandTotal: data.grandTotal || 0,
                    remarks: data.remarks || '',
                    createdAt: data.createdAt,
                    updatedAt: data.updatedAt
                }
            });
            if (created) console.log(`  + Migrated ${data.purchaseNo}`);
        }

        // --- SYNC PRODUCTS ---
        const MongoProduct = mongoose.model('Product', new mongoose.Schema({}, { strict: false }));
        const mongoProducts = await MongoProduct.find();
        console.log(`🔄 Syncing ${mongoProducts.length} Products...`);

        for (const mp of mongoProducts) {
            const d = mp.toObject();
            const [product, created] = await db.Product.findOrCreate({
                where: { name: d.name },
                defaults: {
                    name: d.name,
                    manufacturer: d.manufacturer || '',
                    hsn: d.hsn || '',
                    category: d.category || '',
                    group: d.group || '',
                    packing: d.packing || '',
                    mrp: d.mrp || 0,
                    ptr: d.ptr || 0,
                    pts: d.pts || 0,
                    gstPercent: d.gstPercent || 12,
                    qtyAvailable: d.qtyAvailable || 0,
                    active: d.active !== undefined ? d.active : true,
                    bonusBuy: d.bonusScheme ? d.bonusScheme.buy : 0,
                    bonusGet: d.bonusScheme ? d.bonusScheme.get : 0
                }
            });

            if (!created) {
                await product.update({
                    manufacturer: d.manufacturer || product.manufacturer,
                    hsn: d.hsn || product.hsn,
                    category: d.category || product.category,
                    group: d.group || product.group,
                    packing: d.packing || product.packing,
                    mrp: d.mrp || product.mrp,
                    ptr: d.ptr || product.ptr,
                    pts: d.pts || product.pts,
                    gstPercent: d.gstPercent || product.gstPercent,
                    qtyAvailable: d.qtyAvailable || product.qtyAvailable,
                    active: d.active !== undefined ? d.active : product.active,
                    bonusBuy: d.bonusScheme ? d.bonusScheme.buy : product.bonusBuy,
                    bonusGet: d.bonusScheme ? d.bonusScheme.get : product.bonusGet
                });
            }
        }

        console.log('✅ All data synchronized!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration Error:', e);
        process.exit(1);
    }
}

migrateRemaining();
