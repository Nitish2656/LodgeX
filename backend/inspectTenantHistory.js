require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Tenant = require('./models/Tenant');
const Payment = require('./models/Payment');

async function run() {
  const tenant = await Tenant.findOne({ name: /Nitish/i });
  console.log('Tenant details:', JSON.stringify(tenant, null, 2));
  if (tenant) {
    const payments = await Payment.find({ tenantId: tenant._id.toString() });
    console.log('All payments for this tenant:', JSON.stringify(payments, null, 2));
  }
  process.exit();
}
run();
