import { z } from 'zod';

export const ImageGenerationSchema = z.object({
  prompt: z.string().min(1),
  model: z.string().optional(),
  numberOfImages: z.number().min(1).max(4).optional(),
  outputMimeType: z.string().optional(),
  aspectRatio: z.string().optional(),
  personGeneration: z.string().optional(),
  negativePrompt: z.string().optional(),
  imageInput: z
    .object({
      data: z.string(),
      mimeType: z.string(),
    })
    .optional(),
  referenceImages: z
    .array(
      z.object({
        data: z.string(),
        mimeType: z.string(),
      })
    )
    .optional(),
  imageSize: z.string().optional(),
  searchGrounding: z.boolean().optional(),
});

export type ImageGenerationPayload = z.infer<typeof ImageGenerationSchema>;
