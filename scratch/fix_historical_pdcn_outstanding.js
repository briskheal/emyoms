const { Sequelize } = require('sequelize');
const db = require('../models');

async function fixOutstanding() {
    try {
        await db.sequelize.authenticate();
        console.log('Connected to DB');

        // Find all approved PDCN Claims
        const approvedClaims = await db.PDCNClaim.findAll({
            where: { status: 'approved' }
        });

        console.log(`Found ${approvedClaims.length} approved PDCN Claims to process.`);

        for (const claim of approvedClaims) {
            if (claim.invoiceNo) {
                const invoice = await db.Invoice.findOne({ where: { invoiceNo: claim.invoiceNo } });
                if (invoice) {
                    // Check if there are other payments linked to this invoice?
                    // The easiest way is to recalculate outstandingAmount based on grandTotal - pdcn - payments.
                    // But we just want to ensure this PDCN's amount is subtracted if it hasn't been already.
                    // However, we don't know if it's already been subtracted (since our new logic didn't exist).
                    // Let's just recalculate it properly:
                    // newOutstanding = grandTotal - sum(linked payments) - sum(approved PDCNs for this invoice)
                    
                    const payments = await db.PaymentLink.findAll({
                        where: { invoiceId: invoice.id }
                    });
                    const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount), 0);

                    const allPdcns = await db.PDCNClaim.findAll({
                        where: { invoiceNo: invoice.invoiceNo, status: 'approved' }
                    });
                    const totalPdcns = allPdcns.reduce((sum, p) => sum + Number(p.totalAmount), 0);

                    // Wait, what if invoice was cancelled?
                    if (invoice.status === 'cancelled') {
                        continue;
                    }

                    const expectedOutstanding = Math.max(0, Number(invoice.grandTotal) - totalPayments - totalPdcns);
                    
                    if (Number(invoice.outstandingAmount) !== expectedOutstanding) {
                        console.log(`Updating Invoice ${invoice.invoiceNo}: outstanding ${invoice.outstandingAmount} -> ${expectedOutstanding} (Total: ${invoice.grandTotal}, PDCNs: ${totalPdcns}, Payments: ${totalPayments})`);
                        await invoice.update({ outstandingAmount: expectedOutstanding });
                    }
                }
            }
        }
        console.log('Finished updating historical invoices.');
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

fixOutstanding();
