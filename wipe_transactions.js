require('dotenv').config();
const db = require('./models');

async function wipeTransactions() {
    try {
        console.log("Starting transaction wipe...");
        
        await db.InvoiceItem.destroy({ where: {} });
        await db.Invoice.destroy({ where: {} });
        console.log("Deleted Invoices & Invoice Items");

        await db.PurchaseItem.destroy({ where: {} });
        await db.PurchaseEntry.destroy({ where: {} });
        console.log("Deleted Purchase Entries & Items");

        await db.PDCNClaimItem.destroy({ where: {} });
        await db.PDCNClaim.destroy({ where: {} });
        console.log("Deleted PDCN Claims & Items");

        await db.OrderItem.destroy({ where: {} });
        await db.Order.destroy({ where: {} });
        console.log("Deleted Orders & Order Items");

        await db.JournalEntryLine.destroy({ where: {} });
        await db.JournalVoucher.destroy({ where: {} });
        console.log("Deleted Journal Vouchers & Lines");

        await db.Payment.destroy({ where: {} });
        console.log("Deleted Payments");

        console.log("Wipe completed successfully! Kept Products, Batches, Stockists, and Suppliers.");
        process.exit(0);
    } catch (e) {
        console.error("Error wiping transactions:", e);
        process.exit(1);
    }
}

wipeTransactions();
