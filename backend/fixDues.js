require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // Fix all tenants
    const tenants = await db.collection('tenants').find({ status: 'active' }).toArray();
    for (const t of tenants) {
        const payments = await db.collection('payments').find({ tenantId: t._id.toString(), status: 'pending' }).toArray();
        let correctDues = 0;
        for (const p of payments) {
            correctDues += (p.dueAmount || p.totalAmount);
        }
        console.log(t.name, 'calculated dues:', correctDues);
        await db.collection('tenants').updateOne({ _id: t._id }, { $set: { pendingDues: correctDues } });
    }
    console.log('Fixed pending dues!');
    process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
