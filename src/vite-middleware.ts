import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { apiProxy } from './middleware/apiProxy';
import { imageProxy } from './middleware/imageProxy';

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

app.use(cors());
app.use(express.json());

app.use('/api', imageProxy);
app.use('/api', apiProxy);

app.use('/api', (req, res) => {
  res.status(404).json({ error: `API endpoint not found: ${req.originalUrl}` });
});

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server.';
  const details = err.details || (process.env.NODE_ENV === 'development' ? err.stack : undefined);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    error: message,
    ...(details && { details }),
  });
});

export default app;
