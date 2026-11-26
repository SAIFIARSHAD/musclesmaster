import mongoose from 'mongoose';
import { connectDB } from '../config/db';

const COLLECTION_NAME = 'attendancelogs';

const OLD_INDEX_NAME = 'unique_member_daily_attendance';
const NEW_INDEX_NAME = 'unique_member_open_attendance_session';

const migrateAttendance = async (): Promise<void> => {
  try {
    await connectDB();

    const db = mongoose.connection.db;

    if (!db) {
      throw new Error('MongoDB database connection is not available.');
    }

    const collections = await db
      .listCollections({ name: COLLECTION_NAME })
      .toArray();

    if (collections.length === 0) {
      throw new Error(
        `Collection "${COLLECTION_NAME}" does not exist. Migration stopped.`
      );
    }

    const attendanceCollection = db.collection(COLLECTION_NAME);

    console.log('Checking existing attendance indexes...');

    const indexes = await attendanceCollection.indexes();

    // Check for members who have multiple open attendance sessions.
    const duplicateOpenSessions = await attendanceCollection
      .aggregate([
        {
          $match: {
            attendanceStatus: 'checked-in',
          },
        },
        {
          $group: {
            _id: '$memberId',
            count: { $sum: 1 },
            attendanceIds: { $push: '$_id' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ])
      .toArray();

    if (duplicateOpenSessions.length > 0) {
      console.error(
        'Migration stopped: Some members have multiple open attendance sessions.'
      );

      console.error(JSON.stringify(duplicateOpenSessions, null, 2));

      throw new Error(
        'Resolve duplicate open sessions before running this migration.'
      );
    }

    console.log('No duplicate open sessions found.');

    const newIndexExists = indexes.some(
      (index) => index.name === NEW_INDEX_NAME
    );

    // Create the new index before removing the old constraint.
    if (!newIndexExists) {
      console.log('Creating new unique open-session index...');

      await attendanceCollection.createIndex(
        { memberId: 1 },
        {
          unique: true,
          name: NEW_INDEX_NAME,
          partialFilterExpression: {
            attendanceStatus: 'checked-in',
          },
        }
      );

      console.log('New index created successfully.');
    } else {
      console.log('New index already exists. Skipping creation.');
    }

    const oldIndexExists = indexes.some(
      (index) => index.name === OLD_INDEX_NAME
    );

    if (oldIndexExists) {
      console.log('Removing old daily attendance unique index...');

      await attendanceCollection.dropIndex(OLD_INDEX_NAME);

      console.log('Old index removed successfully.');
    } else {
      console.log('Old index does not exist. Skipping removal.');
    }

    console.log('Attendance migration completed successfully.');
  } catch (error) {
    console.error('Attendance migration failed:', error);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
};

void migrateAttendance();
