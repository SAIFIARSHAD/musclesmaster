import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes';

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(cookieParser());

app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});
app.use('/api/auth', authRoutes);

export default app;