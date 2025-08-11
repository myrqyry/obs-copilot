import express from 'express';
import axios from 'axios';
import { logger } from '@/utils/logger';
import { prefersReducedMotion } from '@/lib/utils';

const router = express.Router();

// Cache for fetched images
const imageCache = new Map<string, { data: Buffer; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/image/:url(*)', async (req, res, next) => {
  const imageUrl = req.params.url;
  const cacheKey = `image_${imageUrl}`;

  // Check cache first
  if (imageCache.has(cacheKey)) {
    const cached = imageCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      logger.info(`Cache hit for image: ${imageUrl}`);
      res.set('Content-Type', 'image/png'); // Assuming PNG, adjust if needed
      return res.send(cached.data);
    } else {
      imageCache.delete(cacheKey); // Remove expired cache entry
    }
  }

  // Check for reduced motion preference
  if (prefersReducedMotion()) {
    logger.info(`Reduced motion detected, skipping image fetch for: ${imageUrl}`);
    return res.status(204).send(); // Send 204 No Content if reduced motion is preferred
  }

  try {
    logger.info(`Fetching image from: ${imageUrl}`);
    const response = await axios.get(imageUrl, {
      responseType: 'arraybuffer',
    });

    const buffer = Buffer.from(response.data);
    const contentType = response.headers['content-type'];

    // Cache the image
    imageCache.set(cacheKey, { data: buffer, timestamp: Date.now() });

    res.set('Content-Type', contentType || 'image/png'); // Use content-type from response or default to PNG
    res.send(buffer);
  } catch (err: unknown) {
    logger.error(
      `Failed to fetch image from ${imageUrl}: ${err instanceof Error ? err.message : String(err)}`,
    );
    res.set({
      'Content-Type': 'application/json',
    });
    res.status(500).json({
      message: 'Failed to fetch image',
      details: err instanceof Error ? err.message : String(err),
    });
  }
});

export default router;
