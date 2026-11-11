
import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

import { startMembershipExpiryJob } from './jobs/membershipExpiry.job';

const startServer = async () => {
  try {
    // First connect to database.
    await connectDB();

    // Start membership expiry and auto-unfreeze cron job.
    startMembershipExpiryJob();

    // Start Express server.
    app.listen(ENV.PORT, () => {
      console.log(`Server running on http://localhost:${ENV.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
