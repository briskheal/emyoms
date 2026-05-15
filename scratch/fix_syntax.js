const fs = require('fs');
const path = 'd:/MY WORK FLOW/EMYOMS/server.js';
let content = fs.readFileSync(path, 'utf8');
const lines = content.split('\n');

// Lines in view_file were 2358 to 2367 (1-indexed)
// 2358: 
// 2359:         const stockist = await db.Stockist.findByPk(partyId);
// 2360:         const adj = type === 'RECEIPT' ? -Number(amount) : Number(amount);
// 2361:         if (stockist) await stockist.increment('outstandingBalance', { by: adj });
// 2362: 
// 2363: 
// 2364:         res.json({ success: true, payment: { ...payment.toJSON(), linkedBills: [] } });
// 2365:     } catch (e) { res.status(500).json({ success: false, error: e.message }); }
// 2366: });

// Remove these lines
lines.splice(2357, 10); // 2357 is 0-indexed for line 2358

fs.writeFileSync(path, lines.join('\n'));
console.log("Fixed server.js syntax error.");
