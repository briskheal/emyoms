/**
 * EMYOMS DATA RESET SCRIPT
 * ========================
 * KEEP : Stockist IDs 3, 5, 7  (HD SALES, AADI PARASWANATH, DR KONS LIFE CARE)
 * DELETE:
 *   - All other stockists + their all dependent records
 *   - ALL purchase entries / purchase items (all stockists)
 *   - ALL sales invoices / invoice items / orders / order items (all stockists)
 *   - ALL payments, payment links, financial notes, note items
 *   - ALL PDCN claims / claim items
 *   - ALL journal vouchers / entry lines
 *   - ALL ledger entries
 * ZERO : Product qtyAvailable + all Batch qtyAvailable
 * RESET: Kept stockists outstandingBalance → 0
 */

require('dotenv').config({ path: '../.env' });
const db = require('../models');
const { Op } = db.Sequelize;

const KEEP_IDS = [3, 5, 7];

(async () => {
    try {
        await db.sequelize.authenticate();
        console.log('✅ DB connected.\n');

        // ─── STEP 1: DELETE CHILD RECORDS of stockists to DELETE first ────────
        const deleteIds = (await db.Stockist.findAll({
            attributes: ['id'],
            where: { id: { [Op.notIn]: KEEP_IDS } }
        })).map(s => s.id);

        console.log(`🗑️  Stockists to DELETE: ${deleteIds.join(', ')}`);

        // ─── STEP 2: Wipe ALL transactional data (all stockists) ──────────────

        // 2a. PDCNClaim items → claims
        const allClaims = await db.PDCNClaim.findAll({ attributes: ['id'] });
        const claimIds = allClaims.map(c => c.id);
        if (claimIds.length) {
            await db.PDCNClaimItem.destroy({ where: { pdcnClaimId: { [Op.in]: claimIds } } });
        }
        await db.PDCNClaim.destroy({ where: {} });
        console.log('✅ Cleared: PDCNClaims + PDCNClaimItems');

        // 2b. NoteItems → FinancialNotes
        const allNotes = await db.FinancialNote.findAll({ attributes: ['id'] });
        const noteIds = allNotes.map(n => n.id);
        if (noteIds.length) {
            await db.NoteItem.destroy({ where: { financialNoteId: { [Op.in]: noteIds } } });
        }
        await db.FinancialNote.destroy({ where: {} });
        console.log('✅ Cleared: FinancialNotes + NoteItems');

        // 2c. Payment links → Payments
        await db.PaymentLink.destroy({ where: {} });
        await db.Payment.destroy({ where: {} });
        console.log('✅ Cleared: Payments + PaymentLinks');

        // 2d. JournalEntryLines → JournalVouchers
        await db.JournalEntryLine.destroy({ where: {} });
        await db.JournalVoucher.destroy({ where: {} });
        console.log('✅ Cleared: JournalVouchers + JournalEntryLines');

        // 2e. Ledger entries
        await db.Ledger.destroy({ where: {} });
        console.log('✅ Cleared: Ledger');

        // 2f. PurchaseItems → PurchaseEntries
        await db.PurchaseItem.destroy({ where: {} });
        await db.PurchaseEntry.destroy({ where: {} });
        console.log('✅ Cleared: PurchaseEntries + PurchaseItems');

        // 2g. InvoiceItems → Invoices
        await db.InvoiceItem.destroy({ where: {} });
        await db.Invoice.destroy({ where: {} });
        console.log('✅ Cleared: Invoices + InvoiceItems');

        // 2h. OrderItems → Orders
        await db.OrderItem.destroy({ where: {} });
        await db.Order.destroy({ where: {} });
        console.log('✅ Cleared: Orders + OrderItems');

        // ─── STEP 3: Delete stockists NOT in keep list ─────────────────────────
        if (deleteIds.length) {
            // InvoiceTemplates for deleted stockists
            await db.InvoiceTemplate.destroy({ where: { stockistId: { [Op.in]: deleteIds } } });
            await db.Stockist.destroy({ where: { id: { [Op.in]: deleteIds } } });
        }
        console.log(`✅ Deleted stockists: ${deleteIds.join(', ')}`);

        // ─── STEP 4: Zero out product quantities ──────────────────────────────
        await db.Product.update({ qtyAvailable: 0 }, { where: {} });
        await db.Batch.update({ qtyAvailable: 0 }, { where: {} });
        console.log('✅ Zeroed: Product.qtyAvailable + Batch.qtyAvailable');

        // ─── STEP 5: Reset kept stockists outstanding balance to 0 ────────────
        await db.Stockist.update({ outstandingBalance: 0 }, { where: { id: { [Op.in]: KEEP_IDS } } });
        console.log('✅ Reset outstandingBalance → 0 for kept stockists');

        // ─── FINAL REPORT ─────────────────────────────────────────────────────
        const remaining = await db.Stockist.findAll({ attributes: ['id', 'name'] });
        console.log('\n=== REMAINING STOCKISTS ===');
        remaining.forEach(s => console.log(`  ID: ${s.id} | ${s.name}`));
        const pCount = await db.Product.count();
        console.log(`\nProducts in master: ${pCount}`);
        console.log('\n✅✅ CLEANUP COMPLETE ✅✅');
        process.exit(0);
    } catch (e) {
        console.error('❌ CLEANUP FAILED:', e.message);
        process.exit(1);
    }
})();
