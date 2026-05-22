require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Payment = require('./models/Payment');
const Tenant = require('./models/Tenant');

async function fixAgain() {
  const tenants = await Tenant.find();
  for (const t of tenants) {
    const rent = t.rent || 0;
    t.pendingDues = rent;
    await t.save();
    
    const payments = await Payment.find({ tenantId: t._id.toString(), status: 'pending' });
    for (const p of payments) {
      p.dueAmount = rent;
      p.totalAmount = rent;
      p.notes = `Monthly Rent - ${p.month || 'May 2026'}`;
      await p.save();
    }
  }
  console.log('Fixed dues to match exact rent.');
  process.exit();
}
fixAgain();
