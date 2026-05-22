require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI)
.then(async () => {
    const db = mongoose.connection.db;
    
    // Find Nitish kumar
    const tenant = await db.collection('tenants').findOne({ name: "Nitish kumar" });
    if (!tenant) {
        console.log("Tenant Nitish kumar not found!");
        process.exit(0);
    }
    
    console.log(`Found Nitish kumar with current pendingDues: ${tenant.pendingDues}`);
    
    // Find and delete the duplicate pending payments for May 2026 (Auto)
    const duplicatePayments = await db.collection('payments').find({
        tenantId: tenant._id.toString(),
        month: "May 2026",
        notes: "Monthly Rent - May 2026 (Auto)",
        status: "pending"
    }).toArray();
    
    console.log(`Found ${duplicatePayments.length} duplicate pending payments to delete.`);
    
    for (const p of duplicatePayments) {
        await db.collection('payments').deleteOne({ _id: p._id });
        console.log(`Deleted payment: ${p._id}`);
    }
    
    // Update Nitish's pendingDues to 0
    await db.collection('tenants').updateOne(
        { _id: tenant._id },
        { $set: { pendingDues: 0 } }
    );
    console.log("Nitish kumar's pendingDues updated to 0.");
    
    process.exit(0);
})
.catch(err => {
    console.error("Error in cleanup script:", err);
    process.exit(1);
});
