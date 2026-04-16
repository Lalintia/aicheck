/**
 * Image AI Readiness Checker
 * Validates whether images on the page are accessible and understandable by AI
 *
 * Why this matters for AI Search:
 * - AI crawlers rely on alt text to understand image content
 * - Google AI Overview can display images with proper context
 * - Images without alt text are invisible to AI — cannot be cited or referenced
 * - figure/figcaption provides semantic context for image-text relationships
 *
 * References:
 * - Google: "Image SEO best practices"
 *   https://developers.google.com/search/docs/appearance/google-images
 * - W3C WAI: "Images Tutorial"
 *   https://www.w3.org/WAI/tutorials/images/
 * - Schema.org: ImageObject
 *   https://schema.org/ImageObject
 * - Google: "Structured data for images"
 *   https://developers.google.com/search/docs/appearance/structured-data/image-license-metadata
 *
 * Weight: see `weights.imageAI` in `./base.ts` (single source of truth)
 */

import type { CheckResult } from './base';
import { createSuccessResult, createPartialResult } from './base';

const PLACEHOLDER_ALT_PATTERNS = [
  /^image\d*$/i,
  /^img[_-]?\d*$/i,
  /^photo\d*$/i,
  /^picture\d*$/i,
  /^untitled$/i,
  /^screenshot/i,
  /^\d+$/,
  /^DSC[_-]?\d+$/i,
  /^IMG[_-]?\d+$/i,
  /\.(jpe?g|png|gif|webp|svg|avif|bmp)$/i,
] as const;

interface ImageInfo {
  readonly hasAlt: boolean;
  readonly altText: string;
  readonly isPlaceholderAlt: boolean;
  readonly hasWidthHeight: boolean;
  readonly isDecorative: boolean;
}

function isPlaceholderAlt(alt: string): boolean {
  const trimmed = alt.trim();
  if (trimmed.length === 0) {
    // alt="" is intentionally decorative — correct accessibility pattern, NOT a placeholder
    return false;
  }
  return PLACEHOLDER_ALT_PATTERNS.some((pattern) => pattern.test(trimmed));
}

function parseImages(html: string): ImageInfo[] {
  const images: ImageInfo[] = [];
  // Cap attribute scan at 2000 chars to prevent pathological backtracking
  // on malformed pages with embedded base64 images and no closing `>`
  const imgRegex = /<img\b([^>]{0,2000})>/gi;
  let match: RegExpExecArray | null;

  while (images.length < 500 && (match = imgRegex.exec(html)) !== null) {
    const attrs = match[1];

    // Skip tracking pixels and tiny images
    const widthMatch = attrs.match(/width=["']?(\d+)/i);
    const heightMatch = attrs.match(/height=["']?(\d+)/i);
    if (widthMatch && heightMatch) {
      const w = parseInt(widthMatch[1], 10);
      const h = parseInt(heightMatch[1], 10);
      if (w <= 2 || h <= 2) {
        continue;
      }
    }

    // Skip decorative images: role="presentation", aria-hidden="true", or alt=""
    // alt="" is the correct HTML pattern for marking decorative images.
    // Also handle unquoted alt attributes (e.g. alt=hello) per HTML spec.
    const altMatch =
      attrs.match(/alt=["']([^"']*)["']/i) ??
      attrs.match(/alt=([^\s>]+)/i);
    const isEmptyAlt = altMatch !== null && altMatch[1].trim() === '';
    const isDecorative =
      /role=["']presentation["']/i.test(attrs) ||
      /aria-hidden=["']true["']/i.test(attrs) ||
      isEmptyAlt;

    const hasAlt = altMatch !== null;
    const altText = altMatch ? altMatch[1].trim() : '';

    const hasWidthHeight =
      /width=["']?\d/i.test(attrs) && /height=["']?\d/i.test(attrs);

    images.push({
      hasAlt,
      altText,
      isPlaceholderAlt: hasAlt ? isPlaceholderAlt(altText) : false,
      hasWidthHeight,
      isDecorative,
    });
  }

  return images;
}

export function checkImageAI(html: string): CheckResult {
  const images = parseImages(html);

  // No images found
  if (images.length === 0) {
    return createSuccessResult(
      'No images found on this page',
      100,
      { imageCount: 0 }
    );
  }

  // Filter out decorative images for alt text analysis
  const contentImages = images.filter((img) => !img.isDecorative);
  const decorativeCount = images.length - contentImages.length;

  if (contentImages.length === 0) {
    return createSuccessResult(
      `${images.length} images found — all marked as decorative`,
      100,
      { imageCount: images.length, decorativeCount }
    );
  }

  // Count stats
  const withAlt = contentImages.filter((img) => img.hasAlt && !img.isPlaceholderAlt).length;
  const withPlaceholderAlt = contentImages.filter((img) => img.isPlaceholderAlt).length;
  const withoutAlt = contentImages.filter((img) => !img.hasAlt).length;
  const withDimensions = contentImages.filter((img) => img.hasWidthHeight).length;

  // Check for figure/figcaption usage
  const figureCount = (html.match(/<figure[\s>]/gi) || []).length;
  const figcaptionCount = (html.match(/<figcaption[\s>]/gi) || []).length;
  const hasFigures = figureCount > 0 && figcaptionCount > 0;

  // Check for ImageObject schema
  const hasImageSchema = /"@type":\s*"ImageObject"/i.test(html);

  // Scoring
  let score = 100;
  const warnings: string[] = [];

  // Alt text scoring (most important — 50 points)
  const altRate = withAlt / contentImages.length;
  if (altRate < 1) {
    const altPenalty = Math.round((1 - altRate) * 50);
    score -= altPenalty;
  }

  if (withoutAlt > 0) {
    warnings.push(`${withoutAlt} image${withoutAlt > 1 ? 's' : ''} missing alt text — AI cannot understand these images`);
  }

  if (withPlaceholderAlt > 0) {
    // Capped at 15. Placeholder alts are already counted as "no alt" in
    // withAlt, which drags down altRate and triggers the altPenalty above —
    // this is a secondary signal, so the cap prevents double-punishing.
    const placeholderPenalty = Math.min(withPlaceholderAlt * 5, 15);
    score -= placeholderPenalty;
    warnings.push(`${withPlaceholderAlt} image${withPlaceholderAlt > 1 ? 's have' : ' has'} placeholder alt text (e.g., "image1.jpg") — use descriptive text instead`);
  }

  // Dimensions scoring (15 points)
  const dimRate = withDimensions / contentImages.length;
  if (dimRate < 0.5) {
    score -= 15;
    warnings.push('Most images missing width/height — causes layout shift and slower page load');
  } else if (dimRate < 1) {
    score -= 7;
  }

  // Figure/figcaption is a nice-to-have, not critical
  if (!hasFigures && contentImages.length >= 3) {
    score -= 5;
    warnings.push('No <figure> + <figcaption> used — adding captions helps AI understand image context');
  }

  // ImageObject schema is a nice-to-have, not critical
  if (!hasImageSchema && contentImages.length >= 3) {
    score -= 3;
    warnings.push('No ImageObject schema found — structured data helps AI index images');
  }

  score = Math.max(0, Math.min(100, score));

  const data: Record<string, unknown> = {
    imageCount: images.length,
    contentImageCount: contentImages.length,
    decorativeCount,
    withAlt,
    withPlaceholderAlt,
    withoutAlt,
    withDimensions,
    altTextRate: Math.round(altRate * 100),
    hasFigures,
    figureCount,
    figcaptionCount,
    hasImageSchema,
  };

  if (score >= 80) {
    return createSuccessResult(
      `${withAlt}/${contentImages.length} images have proper alt text (${Math.round(altRate * 100)}%)`,
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  if (score >= 50) {
    return createPartialResult(
      `${withAlt}/${contentImages.length} images have alt text — AI can partially understand your images`,
      score,
      data,
      warnings.length > 0 ? warnings : undefined
    );
  }

  return createPartialResult(
    `Only ${withAlt}/${contentImages.length} images have proper alt text — AI cannot understand most images`,
    score,
    data,
    warnings.length > 0 ? warnings : undefined
  );
}
