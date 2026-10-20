require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const update = { $set: { isVerified: true } };
  const r = await mongoose.connection.db
    .collection('users')
    .updateMany({ isVerified: false }, update);
  console.log(`✅ Fixed ${r.modifiedCount} unverified user(s). All accounts can now log in.`);
  process.exit(0);
}).catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
