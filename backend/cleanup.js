require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const db = mongoose.connection.db;
    const tenants = await db.collection('tenants').find({ status: 'active' }).toArray();
    for (const t of tenants) {
        if (!t.joinDate) continue;
        const joinDate = new Date(t.joinDate);
        const joinMonthLabel = joinDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        const currentMonthLabel = new Date().toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
        
        if (joinMonthLabel === currentMonthLabel) {
            console.log('Fixing auto-billing for:', t.name);
            const payments = await db.collection('payments').find({
                tenantId: t._id.toString(),
                month: currentMonthLabel,
                notes: 'Monthly Rent - ' + currentMonthLabel + ' (Auto)'
            }).toArray();
            
            for (const p of payments) {
                console.log('Deleting auto payment:', p._id, 'amount:', p.totalAmount);
                await db.collection('payments').deleteOne({ _id: p._id });
                await db.collection('tenants').updateOne(
                    { _id: t._id },
                    { $inc: { pendingDues: -p.totalAmount } }
                );
            }
        }
    }
    console.log('Done!');
    process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
