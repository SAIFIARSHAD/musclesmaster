import mongoose from 'mongoose';
import { User } from '../models/User.model';
import { UserRole } from '../constants/roles.enum';
import { ENV } from '../config/env';

const seedTestUser = async () => {
  try {
    await mongoose.connect(ENV.MONGODB_URI);
    console.log('Connected to MongoDB for seeding...');

    const existingUser = await User.findOne({ email: 'admin@test.com' });
    if (existingUser) {
      console.log('Test user already exists. Skipping.');
      process.exit(0);
    }

    const testUser = new User({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'Test@1234',
      mobile: '9999999999',
      role: UserRole.SUPER_ADMIN,
      isActive: true,
    });

    await testUser.save();
    console.log('Test user created successfully:');
    console.log('Email: admin@test.com');
    console.log('Password: Test@1234');

    process.exit(0);
  } catch (error) {
    console.error('Seeding failed:', error);
    process.exit(1);
  }
};

seedTestUser();