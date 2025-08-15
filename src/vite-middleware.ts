import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiProxy from './middleware/apiProxy';
import imageProxy from './middleware/imageProxy';

const app = express();


app.use(cors());
app.use(express.json());

app.use('/api', imageProxy);
app.use('/api', apiProxy);

app.use('/api', (_req, res) => {
  res.status(404).json({ error: `API endpoint not found` });
});

app.use((err: any, _req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500;
  const message = err.message || 'Something went wrong on the server.';
  const isServer = typeof window === 'undefined';
  const details = err.details ?? (isServer ? (process?.env?.NODE_ENV === 'development' ? err.stack : undefined) : undefined);

  if (res.headersSent) {
    return next(err);
  }

  res.status(status).json({
    error: message,
    ...(details && { details }),
  });
});

export default app;
