require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Room = require('./models/Room');
const Tenant = require('./models/Tenant');

async function syncRooms() {
  const tenants = await Tenant.find();
  for (const t of tenants) {
    if (t.roomId) {
      await Room.findByIdAndUpdate(t.roomId, {
        status: 'occupied',
        tenantId: t._id.toString()
      });
      console.log(`Synced room ${t.roomNumber} with tenant ${t.name}`);
    }
  }
  process.exit();
}
syncRooms();
