import mongoose from 'mongoose';
import { User } from './models/User';

async function run() {
  await mongoose.connect('mongodb://localhost:27017/genquantaa_pharmacy');
  const user = await User.findOne({ email: 'jane@healthfirst.com' });
  console.log(user);
  process.exit(0);
}

run();
