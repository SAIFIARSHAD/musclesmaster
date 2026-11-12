import http from 'http';

import app from './app';
import { connectDB } from './config/db';
import { ENV } from './config/env';

import { startMembershipExpiryJob } from './jobs/membershipExpiry.job';
import { initializeSocket } from './config/socket';

const startServer = async () => {
  try {
    // First connect to database.
    await connectDB();

    // Create HTTP server using Express app.
    const httpServer = http.createServer(app);

    // Initialize Socket.IO.
    initializeSocket(httpServer);

    // Start membership expiry and auto-unfreeze cron job.
    startMembershipExpiryJob();

    // Start HTTP server.
    httpServer.listen(ENV.PORT, () => {
      console.log(`Server running on http://localhost:${ENV.PORT}`);
      console.log('Socket.IO server initialized successfully.');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
