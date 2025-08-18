import express from 'express';
import { GoogleGenAI } from '@google/genai';
import 'dotenv/config';

const app = express();
app.use(express.json());

const API_KEY = process.env.VITE_GEMINI_API_KEY;
if (!API_KEY) {
  throw new Error('VITE_GEMINI_API_KEY is not set in the environment variables.');
}

const genAI = new GoogleGenAI({ apiKey: API_KEY });

// A separate client for the v1alpha features like ephemeral tokens
const genAIAlpha = new GoogleGenAI({ apiKey: API_KEY, httpOptions: { apiVersion: 'v1alpha' } });

app.post('/api/gemini/generateContent', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ text });
  } catch (error) {
    console.error('Error calling Gemini API for content generation:', error);
    res.status(500).json({ error: 'Failed to generate content from Gemini' });
  }
});

app.post('/api/gemini/generateImage', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const response = await genAI.models.generateImages({
      model: 'imagen-3.0-generate-001',
      prompt: prompt,
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      const image = response.generatedImages[0];
      if (image.image && image.image.imageBytes) {
        const imageBase64 = Buffer.from(image.image.imageBytes).toString('base64');
        res.json({ imageBase64 });
      } else {
        throw new Error('Generated image data is missing.');
      }
    } else {
      throw new Error('No images were generated.');
    }
  } catch (error) {
    console.error('Error calling Gemini API for image generation:', error);
    res.status(500).json({ error: 'Failed to generate image from Gemini' });
  }
});

app.post('/api/gemini/generateToken', async (req, res) => {
    try {
        const token = await genAIAlpha.authTokens.create({});
        res.json({ token: token.name });
    } catch (error) {
        console.error('Error creating ephemeral token:', error);
        res.status(500).json({ error: 'Failed to create ephemeral token' });
    }
});

export default app;
