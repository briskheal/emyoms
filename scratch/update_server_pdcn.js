const fs = require('fs');
const path = require('path');

const serverFile = path.join(__dirname, '..', 'server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

const targetStr = `        // Update Stockist Balance
        await db.Stockist.decrement('outstandingBalance', { 
            by: claim.totalAmount, 
            where: { id: claim.stockistId } 
        });`;

const replacementStr = `        // Update Stockist Balance
        await db.Stockist.decrement('outstandingBalance', { 
            by: claim.totalAmount, 
            where: { id: claim.stockistId } 
        });

        // Update Invoice Outstanding Amount
        if (claim.invoiceNo) {
            const invoiceToUpdate = await db.Invoice.findOne({ where: { invoiceNo: claim.invoiceNo } });
            if (invoiceToUpdate && invoiceToUpdate.outstandingAmount > 0) {
                const newOutstanding = Math.max(0, Number(invoiceToUpdate.outstandingAmount) - claim.totalAmount);
                await invoiceToUpdate.update({ outstandingAmount: newOutstanding });
            }
        }`;

serverContent = serverContent.replace(targetStr, replacementStr);
fs.writeFileSync(serverFile, serverContent);
console.log('server.js updated with invoice outstandingAmount logic');
