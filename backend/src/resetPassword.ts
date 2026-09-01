import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from './models/User';

async function resetPassword() {
  try {
    await mongoose.connect('mongodb://localhost:27017/genquantaa_pharmacy');
    const passwordHash = await bcrypt.hash('password123', 12);
    
    const result = await User.updateOne(
      { email: 'jane@healthfirst.com' },
      { $set: { passwordHash: passwordHash } }
    );
    
    console.log('Password updated successfully:', result);
    process.exit(0);
  } catch (err) {
    console.error('Error updating password:', err);
    process.exit(1);
  }
}

resetPassword();
