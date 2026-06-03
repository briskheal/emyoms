const fs = require('fs');
let c = fs.readFileSync('admin-script.js', 'utf8');

c = c.replace(
    /const extraFields = \[\s*\{ label: 'Place of Supply', value: inv.placeOfSupply \|\| partyData.state \|\| partyData.city \|\| companyProfile.defaultPlaceOfSupply \|\| 'Telangana' \},\s*\{ label: 'Due Date', value: inv.dueDate \? new Date\(inv.dueDate\).toLocaleDateString\('en-GB'\) : 'N\/A' \}\s*\];/g,
    `const invDate = new Date(inv.createdAt || new Date());
        const paymentDueDays = Number(companyProfile?.paymentDueDays) || 21;
        const calcDueDate = inv.dueDate ? new Date(inv.dueDate) : new Date(invDate.getTime() + paymentDueDays * 24 * 60 * 60 * 1000);

        const extraFields = [
            { label: 'Place of Supply', value: inv.placeOfSupply || partyData.state || partyData.city || companyProfile.defaultPlaceOfSupply || 'Telangana' },
            { label: 'Due Date', value: calcDueDate.toLocaleDateString('en-GB') }
        ];`
);

fs.writeFileSync('admin-script.js', c);
console.log("Fixed extraFields in admin-script.js");
