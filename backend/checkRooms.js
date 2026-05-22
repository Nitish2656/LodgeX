require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI);
const Room = require('./models/Room');
const Tenant = require('./models/Tenant');

async function checkRooms() {
  const rooms = await Room.find();
  console.log('Rooms:', rooms.map(r => ({ number: r.number, status: r.status, tenantId: r.tenantId })));
  
  const tenants = await Tenant.find();
  console.log('Tenants:', tenants.map(t => ({ name: t.name, roomId: t.roomId, roomNumber: t.roomNumber })));
  
  process.exit();
}
checkRooms();
