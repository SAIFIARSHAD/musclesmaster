import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import branchRoutes from './routes/branch.routes';
import branchSettingsRoutes from './routes/branchSettings.routes';
import memberRoutes from './routes/member.routes';

const app: Application = express();

app.use(helmet());

app.use(
  cors({
    origin: 'http://localhost:5173',
    credentials: true,
  }),
);

app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/branches', branchSettingsRoutes);
app.use('/api/members', memberRoutes);

export default app;