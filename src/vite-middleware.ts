import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import apiProxy from './middleware/apiProxy';
import imageProxy from './middleware/imageProxy';
import { handleSearchKnowledgeBase } from './middleware/searchKnowledgeBase';

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

// Adapter: convert Express req to a Fetch-like Request for knowledge base search
function expressReqToRequest(req: express.Request): Request {
  // Build a URL that mirrors the internal API endpoint used by the knowledge base middleware
  const queryQuery = (req.query?.query ?? '') as string;
  const limitParam = (req.query?.limit ?? '3') as string;
  const url = new URL(`http://localhost/api/search-knowledge-base?query=${encodeURIComponent(String(queryQuery))}&limit=${encodeURIComponent(String(limitParam))}`);
  return new Request(url.toString(), { method: 'GET', headers: { 'Accept': 'application/json' } });
}

// Route: GET /api/search-knowledge-base
app.get('/api/search-knowledge-base', async (req, res) => {
  try {
    const reqAsFetch = expressReqToRequest(req);
    const resp = await handleSearchKnowledgeBase(reqAsFetch);
    const status = resp.status;
    const contentType = resp.headers.get('content-type') || '';
    const text = await resp.text();

    res.status(status);
    if (contentType.includes('application/json')) {
      // Attempt to parse JSON; if parsing fails, fall back to raw text
      try {
        res.json(JSON.parse(text));
      } catch {
        res.send(text);
      }
    } else {
      res.send(text);
    }
  } catch (err) {
    res.status(500).json({ error: 'Internal server error while searching knowledge base.' });
  }
});

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
