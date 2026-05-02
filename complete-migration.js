const mongoose = require('mongoose');
const db = require('./models');
const dotenv = require('dotenv');
dotenv.config();

async function completeMigration() {
    const mongoUri = "mongodb+srv://emyrisbio_db_user:3dJQcHrI6fLHUY9F@cluster0.yzsqdep.mongodb.net/emyris-oms?retryWrites=true&w=majority&appName=Cluster0";
    
    try {
        await mongoose.connect(mongoUri);
        console.log('✅ MongoDB Connected');
        await db.sequelize.authenticate();
        console.log('✅ PostgreSQL Connected');

        // Maps for foreign keys
        const sqlStockists = await db.Stockist.findAll();
        const stockistMap = {}; // loginId -> id
        sqlStockists.forEach(s => stockistMap[s.loginId] = s.id);
        const stockistNameMap = {}; // name.toUpperCase() -> id
        sqlStockists.forEach(s => stockistNameMap[s.name.toUpperCase()] = s.id);

        const sqlProducts = await db.Product.findAll();
        const productMap = {}; // name.toUpperCase() -> id
        sqlProducts.forEach(p => productMap[p.name.toUpperCase()] = p.id);

        // 1. Migrate Missing Orders
        const mongoOrders = await mongoose.connection.db.collection('orders').find().toArray();
        console.log(`Checking ${mongoOrders.length} Orders...`);
        for (const mo of mongoOrders) {
            const exists = await db.Order.findOne({ where: { orderNo: mo.orderNo } });
            if (!exists) {
                console.log(`  + Migrating Order: ${mo.orderNo}`);
                const sId = stockistMap[mo.stockistCode] || stockistNameMap[mo.stockistName ? mo.stockistName.toUpperCase() : ''];
                const order = await db.Order.create({
                    orderNo: mo.orderNo,
                    stockistCode: mo.stockistCode,
                    subTotal: mo.subTotal || 0,
                    gstAmount: mo.gstAmount || 0,
                    grandTotal: mo.grandTotal || 0,
                    status: mo.status || 'pending',
                    hq: mo.hq || '',
                    stockistId: sId,
                    createdAt: mo.createdAt,
                    updatedAt: mo.updatedAt
                });

                // Migrate Items
                if (mo.items && Array.isArray(mo.items)) {
                    for (const item of mo.items) {
                        const pId = productMap[item.name.toUpperCase()];
                        await db.OrderItem.create({
                            name: item.name,
                            manufacturer: item.manufacturer,
                            batch: item.batch,
                            mfgDate: item.mfgDate,
                            expDate: item.expDate,
                            qty: item.qty,
                            bonusQty: item.bonusQty || 0,
                            priceUsed: item.priceUsed,
                            askingRate: item.askingRate,
                            masterRate: item.masterRate,
                            negotiationNote: item.negotiationNote,
                            totalValue: item.totalValue,
                            orderId: order.id,
                            productId: pId
                        });
                    }
                }
            }
        }

        // 2. Migrate Missing Invoices
        const mongoInvoices = await mongoose.connection.db.collection('invoices').find().toArray();
        console.log(`Checking ${mongoInvoices.length} Invoices...`);
        for (const mi of mongoInvoices) {
            const exists = await db.Invoice.findOne({ where: { invoiceNo: mi.invoiceNo } });
            if (!exists) {
                console.log(`  + Migrating Invoice: ${mi.invoiceNo}`);
                const sId = stockistMap[mi.stockistCode] || stockistNameMap[mi.stockistName ? mi.stockistName.toUpperCase() : ''];
                const inv = await db.Invoice.create({
                    invoiceNo: mi.invoiceNo,
                    stockistId: sId,
                    subTotal: mi.subTotal || 0,
                    gstAmount: mi.gstAmount || 0,
                    grandTotal: mi.grandTotal || 0,
                    status: mi.status || 'approved',
                    dueDate: mi.dueDate,
                    createdAt: mi.createdAt,
                    updatedAt: mi.updatedAt
                });

                if (mi.items && Array.isArray(mi.items)) {
                    for (const item of mi.items) {
                        const pId = productMap[item.name.toUpperCase()];
                        await db.InvoiceItem.create({
                            name: item.name,
                            batch: item.batch,
                            mfgDate: item.mfgDate,
                            expDate: item.expDate,
                            qty: item.qty,
                            free: item.free || 0,
                            mrp: item.mrp,
                            ptr: item.ptr,
                            gstPercent: item.gstPercent,
                            amount: item.amount,
                            invoiceId: inv.id,
                            productId: pId
                        });
                    }
                }
            }
        }

        // 3. Migrate Missing Financial Notes
        const mongoNotes = await mongoose.connection.db.collection('financialnotes').find().toArray();
        console.log(`Checking ${mongoNotes.length} Financial Notes...`);
        for (const mn of mongoNotes) {
            const exists = await db.FinancialNote.findOne({ where: { noteNo: mn.noteNo } });
            if (!exists) {
                console.log(`  + Migrating Note: ${mn.noteNo}`);
                const sId = stockistMap[mn.partyCode] || stockistNameMap[mn.partyName ? mn.partyName.toUpperCase() : ''];
                await db.FinancialNote.create({
                    noteNo: mn.noteNo,
                    noteType: mn.noteType,
                    stockistId: sId,
                    amount: mn.amount,
                    reason: mn.reason,
                    description: mn.description,
                    createdAt: mn.createdAt,
                    updatedAt: mn.updatedAt
                });
            }
        }

        // 4. Migrate Missing Payments
        const mongoPayments = await mongoose.connection.db.collection('payments').find().toArray();
        console.log(`Checking ${mongoPayments.length} Payments...`);
        for (const mp of mongoPayments) {
            const exists = await db.Payment.findOne({ where: { paymentNo: mp.paymentNo } });
            if (!exists) {
                console.log(`  + Migrating Payment: ${mp.paymentNo}`);
                const sId = stockistMap[mp.partyCode] || stockistNameMap[mp.partyName ? mp.partyName.toUpperCase() : ''];
                await db.Payment.create({
                    paymentNo: mp.paymentNo,
                    stockistId: sId,
                    amount: mp.amount,
                    method: mp.method,
                    type: mp.type,
                    date: mp.date,
                    createdAt: mp.createdAt,
                    updatedAt: mp.updatedAt
                });
            }
        }

        // 5. Migrate Missing Purchase Entries
        const mongoPurchases = await mongoose.connection.db.collection('purchaseentries').find().toArray();
        console.log(`Checking ${mongoPurchases.length} Purchase Entries...`);
        for (const mp of mongoPurchases) {
            if (!mp.purchaseNo) {
                console.log(`  ! Skipping Purchase Entry without purchaseNo (ID: ${mp._id})`);
                continue;
            }
            const exists = await db.PurchaseEntry.findOne({ where: { purchaseNo: mp.purchaseNo } });
            if (!exists) {
                console.log(`  + Migrating Purchase Entry: ${mp.purchaseNo}`);
                const sId = stockistMap[mp.supplierCode] || stockistNameMap[mp.supplierName ? mp.supplierName.toUpperCase() : ''];
                await db.PurchaseEntry.create({
                    purchaseNo: mp.purchaseNo,
                    supplierId: sId,
                    supplierInvoiceNo: mp.supplierInvoiceNo,
                    invoiceDate: mp.invoiceDate,
                    subTotal: mp.subTotal || 0,
                    gstAmount: mp.gstAmount || 0,
                    grandTotal: mp.grandTotal || 0,
                    remarks: mp.remarks || '',
                    createdAt: mp.createdAt,
                    updatedAt: mp.updatedAt
                });
            }
        }

        // 6. Migrate Missing Media
        const mongoMedia = await mongoose.connection.db.collection('media').find().toArray();
        console.log(`Checking ${mongoMedia.length} Media items...`);
        for (const mm of mongoMedia) {
            const exists = await db.Media.findOne({ where: { url: mm.url } });
            if (!exists) {
                console.log(`  + Migrating Media: ${mm.name}`);
                await db.Media.create({
                    name: mm.name,
                    url: mm.url,
                    type: mm.type || 'document',
                    createdAt: mm.createdAt,
                    updatedAt: mm.updatedAt
                });
            }
        }

        // 7. Sync Stockist Billing Details
        const mongoStockists = await mongoose.connection.db.collection('stockists').find().toArray();
        console.log(`Syncing billing details for ${mongoStockists.length} Stockists...`);
        for (const ms of mongoStockists) {
            const sqlS = await db.Stockist.findOne({ where: { loginId: ms.loginId } });
            if (sqlS) {
                await sqlS.update({
                    bankName: ms.bankName || sqlS.bankName,
                    bankAccountNo: ms.bankAccountNo || sqlS.bankAccountNo,
                    bankIfsc: ms.bankIfsc || sqlS.bankIfsc
                });
            }
        }

        console.log('✅ MIGRATION COMPLETED!');
        process.exit(0);
    } catch (e) {
        console.error('❌ Migration Error:', e);
        process.exit(1);
    }
}

completeMigration();
