require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
    const db = mongoose.connection.db;
    
    // 1. Find Vinay
    const vinay = await db.collection('tenants').findOne({ name: 'Vinay' });
    if (vinay) {
        console.log('Found Vinay:', vinay._id);
        
        // 2. Set Room 401 to occupied
        await db.collection('rooms').updateOne(
            { number: '401' },
            { $set: { status: 'occupied', tenantId: vinay._id.toString() } }
        );
        console.log('Room 401 updated.');
        
        // 3. Create initial payment if missing
        const payments = await db.collection('payments').find({ tenantId: vinay._id.toString() }).toArray();
        if (payments.length === 0) {
            console.log('Creating initial payment for Vinay...');
            await db.collection('payments').insertOne({
                tenantId: vinay._id.toString(),
                tenantName: 'Vinay',
                roomId: '6a035a59c929975db009bc0d',
                roomNumber: '401',
                totalAmount: 2000,
                paidAmount: 400,
                dueAmount: 1600,
                method: 'Cash',
                status: 'pending',
                month: 'May 2026',
                notes: 'Advance/Deposit payment on allocation',
                date: new Date().toISOString()
            });
            await db.collection('tenants').updateOne(
                { _id: vinay._id },
                { $set: { pendingDues: 1600 } }
            );
            console.log('Payment created and dues updated.');
        }
    }
    process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
