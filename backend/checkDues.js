require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Payment = require('./models/Payment');
const Tenant = require('./models/Tenant');

async function check() {
  const tenants = await Tenant.find();
  for (const t of tenants) {
    console.log(`\nTenant: ${t.name} (Rent: ${t.rent}) - Total Pending Dues: ${t.pendingDues}`);
    const payments = await Payment.find({ tenantId: t._id.toString(), status: 'pending' });
    for (const p of payments) {
      console.log(`  -> Month: ${p.month}, Due: ${p.dueAmount}, Total: ${p.totalAmount}, Notes: ${p.notes}`);
    }
  }
  process.exit();
}
check();
