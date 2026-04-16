import { z } from 'zod';

/**
 * URL Validation Schemas using Zod
 */

export const urlSchema = z
  .string()
  .min(1, 'URL is required')
  .max(2048, 'URL is too long')
  .transform((val) => val.trim())
  .transform((val) =>
    val.startsWith('http://') || val.startsWith('https://') ? val : `https://${val}`
  )
  .refine(
    (val) => {
      try {
        new URL(val);
        return true;
      } catch {
        return false;
      }
    },
    { message: 'Please enter a valid URL (e.g., www.example.com)' }
  )
  .transform((val) => val.replace(/\/$/, ''));

export const checkRequestSchema = z.object({
  url: urlSchema,
});

export type CheckRequestInput = z.infer<typeof checkRequestSchema>;
