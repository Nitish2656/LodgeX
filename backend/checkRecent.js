require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Payment = require('./models/Payment');

async function check() {
  const payments = await Payment.find().sort({ createdAt: -1 }).limit(5);
  console.log(payments);
  process.exit();
}
check();
