const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // useNewUrlParser and useUnifiedTopology are deprecated since Mongoose 6+
    // and removed in Mongoose 7+. Don't pass them to avoid warnings.
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
