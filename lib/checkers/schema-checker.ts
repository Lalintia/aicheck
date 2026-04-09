/**
 * Schema.org Checker with Deep Validation
 * Validates JSON-LD structured data implementation
 * Weight: 25% (increased from 20%)
 */

import type { CheckResult } from './base';
import { createSuccessResult, createFailureResult, createPartialResult } from './base';
import {
  validateOrganizationAndWebSite,
  validateArticleSchemas,
  validateBreadcrumbList,
  validateWebPage,
  validateLocalBusiness,
} from './schema-validators';
import { extractRawJsonLdScripts } from './schema-validators/jsonld-utils';
import type {
  SchemaValidationResult as OrgSchemaValidationResult,
} from './schema-validators/organization-validator';
import type {
  ArticleValidationResult,
  BreadcrumbListResult,
  WebPageResult,
  LocalBusinessResult,
} from './schema-validators';

interface DetailedSchemaResult {
  organizations: OrgSchemaValidationResult[];
  websites: OrgSchemaValidationResult[];
  articles: ArticleValidationResult[];
  breadcrumbLists: BreadcrumbListResult[];
  webPages: WebPageResult[];
  localBusinesses: LocalBusinessResult[];
  overallScore: number;
  totalSchemas: number;
  validSchemas: number;
  invalidSchemas: number;
}

export function checkSchema(_url: string, html: string): CheckResult {
  // Limit HTML size to prevent ReDoS and memory issues (5MB max)
  const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
  if (html.length > MAX_HTML_SIZE) {
    return createFailureResult('HTML content too large to analyze', {
      size: html.length,
      maxSize: MAX_HTML_SIZE,
    });
  }

  try {
    // Extract raw scripts ONCE — reuse for both parsing and valid/invalid count
    // This eliminates redundant calls to extractJsonLdScripts + extractRawJsonLdScripts
    const rawScripts = extractRawJsonLdScripts(html);
    const scripts: unknown[] = [];
    let validCount = 0;
    let invalidCount = 0;
    for (const raw of rawScripts) {
      try {
        scripts.push(JSON.parse(raw));
        validCount++;
      } catch {
        invalidCount++;
      }
    }

    // Pass pre-parsed scripts — validators no longer re-extract from HTML
    const orgWebSiteResult = validateOrganizationAndWebSite(scripts);
    const articleResult = validateArticleSchemas(scripts);

    // Parse all schemas from scripts
    const allSchemas: unknown[] = [];
    for (const script of scripts) {
      if (typeof script === 'object' && script !== null) {
        const scriptObj = script as { readonly '@graph'?: readonly unknown[] };
        if (scriptObj['@graph'] && Array.isArray(scriptObj['@graph'])) {
          allSchemas.push(...scriptObj['@graph']);
        } else {
          allSchemas.push(script);
        }
      }
    }
    
    // Validate BreadcrumbList, WebPage, LocalBusiness
    const breadcrumbLists: BreadcrumbListResult[] = [];
    const webPages: WebPageResult[] = [];
    const localBusinesses: LocalBusinessResult[] = [];
    
    for (const schema of allSchemas) {
      if (typeof schema === 'object' && schema !== null) {
        const schemaObj = schema as Record<string, unknown>;
        const type = schemaObj['@type'];
        if (type === 'BreadcrumbList') {
          const result = validateBreadcrumbList(schemaObj);
          if (result) breadcrumbLists.push(result);
        } else if (type === 'WebPage') {
          const result = validateWebPage(schemaObj);
          if (result) webPages.push(result);
        } else if (typeof type === 'string' && 
                   (type === 'LocalBusiness' || type.includes('Business') || 
                    ['Restaurant', 'Store', 'Dentist', 'Hospital', 'Hotel', 'AutoRepair'].includes(type))) {
          const result = validateLocalBusiness(schemaObj);
          if (result) localBusinesses.push(result);
        }
      }
    }

    // Calculate overall score
    const detailedResult: DetailedSchemaResult = {
      organizations: [...orgWebSiteResult.organization.results],
      websites: [...orgWebSiteResult.website.results],
      articles: [...articleResult.articles],
      breadcrumbLists,
      webPages,
      localBusinesses,
      overallScore: 0,
      totalSchemas: 0,
      validSchemas: 0,
      invalidSchemas: 0,
    };

    // Use pre-extracted counts from the single rawScripts pass at the top
    detailedResult.totalSchemas = rawScripts.length;
    detailedResult.validSchemas = validCount;
    detailedResult.invalidSchemas = invalidCount;

    // Calculate weighted score
    let totalScore = 0;
    let maxPossibleScore = 0;

    // Organization: 30% weight (critical for AI Search)
    if (orgWebSiteResult.organization.found && orgWebSiteResult.organization.results.length > 0) {
      totalScore += orgWebSiteResult.organization.bestScore * 0.30;
      maxPossibleScore += 30;
    }

    // WebSite: 20% weight
    if (orgWebSiteResult.website.found && orgWebSiteResult.website.results.length > 0) {
      totalScore += orgWebSiteResult.website.bestScore * 0.20;
      maxPossibleScore += 20;
    }

    // Article/BlogPosting: 15% weight
    if (articleResult.articles.length > 0) {
      const bestArticle = Math.max(...articleResult.articles.map(a => a.score));
      totalScore += bestArticle * 0.15;
      maxPossibleScore += 15;
    }

    // BreadcrumbList: 15% weight (important for navigation)
    if (breadcrumbLists.length > 0) {
      const bestBreadcrumb = Math.max(...breadcrumbLists.map(b => b.score));
      totalScore += bestBreadcrumb * 0.15;
      maxPossibleScore += 15;
    }

    // WebPage: 10% weight
    if (webPages.length > 0) {
      const bestWebPage = Math.max(...webPages.map(w => w.score));
      totalScore += bestWebPage * 0.10;
      maxPossibleScore += 10;
    }

    // LocalBusiness: 10% weight (if present)
    if (localBusinesses.length > 0) {
      const bestLocalBusiness = Math.max(...localBusinesses.map(l => l.score));
      totalScore += bestLocalBusiness * 0.10;
      maxPossibleScore += 10;
    }

    // Normalize score if not all schema types are present
    if (maxPossibleScore > 0) {
      detailedResult.overallScore = Math.round((totalScore / maxPossibleScore) * 100);
    } else {
      detailedResult.overallScore = 0;
    }

    // Penalty for invalid JSON
    if (invalidCount > 0) {
      detailedResult.overallScore = Math.floor(detailedResult.overallScore * 0.8);
    }

    // Generate warnings and recommendations
    const warnings: string[] = [];
    const recommendations: string[] = [];

    if (invalidCount > 0) {
      warnings.push(`${invalidCount} invalid JSON-LD script(s) found`);
    }

    if (!orgWebSiteResult.organization.found) {
      warnings.push('Missing Organization schema (critical for AI understanding)');
      recommendations.push('Add Organization schema with name, url, and logo');
    } else if (orgWebSiteResult.organization.results[0]) {
      const bestOrg = orgWebSiteResult.organization.results[0];
      if (bestOrg.missingRequired.length > 0) {
        warnings.push(`Organization schema missing: ${bestOrg.missingRequired.join(', ')}`);
      }
    }

    if (!orgWebSiteResult.website.found) {
      warnings.push('Missing WebSite schema');
      recommendations.push('Add WebSite schema with name, url, and potentialAction (SearchAction)');
    }

    if (breadcrumbLists.length === 0) {
      recommendations.push('Add BreadcrumbList schema to help AI understand site structure');
    }

    // Build detailed message
    const parts: string[] = [];
    if (orgWebSiteResult.organization.found) {
      parts.push(`${orgWebSiteResult.organization.results.length} Organization`);
    }
    if (orgWebSiteResult.website.found) {
      parts.push(`${orgWebSiteResult.website.results.length} WebSite`);
    }
    if (articleResult.articles.length > 0) {
      parts.push(`${articleResult.articles.length} Article`);
    }
    if (breadcrumbLists.length > 0) {
      parts.push(`${breadcrumbLists.length} BreadcrumbList`);
    }
    if (localBusinesses.length > 0) {
      parts.push(`${localBusinesses.length} LocalBusiness`);
    }

    const details = parts.length > 0 
      ? `Found: ${parts.join(', ')} (Score: ${detailedResult.overallScore}%)`
      : 'Schema.org JSON-LD found but missing important types';

    // Create result with detailed data
    const resultData = {
      totalSchemas: detailedResult.totalSchemas,
      validSchemas: detailedResult.validSchemas,
      invalidSchemas: detailedResult.invalidSchemas,
      organizations: detailedResult.organizations.map(o => ({
        score: o.score,
        found: o.found,
        missingRequired: (o as OrgSchemaValidationResult).missingRequired,
        missingRecommended: (o as OrgSchemaValidationResult).missingRecommended,
        errors: o.errors,
        warnings: o.warnings,
      })),
      websites: detailedResult.websites.map(w => ({
        score: w.score,
        found: w.found,
        missingRequired: (w as OrgSchemaValidationResult).missingRequired,
        missingRecommended: (w as OrgSchemaValidationResult).missingRecommended,
        errors: w.errors,
        warnings: w.warnings,
      })),
      articles: detailedResult.articles.map(a => ({
        score: a.score,
        found: a.found,
        missingRequired: a.missingRequired,
        missingRecommended: a.missingRecommended,
        errors: a.errors,
        warnings: a.warnings,
      })),
      breadcrumbLists: detailedResult.breadcrumbLists.map(b => ({
        score: b.score,
        itemCount: b.itemCount,
        hasValidPositions: b.hasValidPositions,
        errors: b.errors,
        warnings: b.warnings,
      })),
      localBusinesses: detailedResult.localBusinesses.map(l => ({
        score: l.score,
        specificType: l.specificType,
        hasRequiredFields: l.hasRequiredFields,
        addressValid: l.addressValid,
        errors: l.errors,
        warnings: l.warnings,
      })),
      recommendations,
    };

    if (detailedResult.overallScore >= 80) {
      return createSuccessResult(
        details,
        detailedResult.overallScore,
        resultData,
        warnings.length > 0 ? warnings : undefined
      );
    }

    if (detailedResult.overallScore >= 40) {
      return createPartialResult(
        details,
        detailedResult.overallScore,
        resultData,
        warnings.length > 0 ? warnings : undefined
      );
    }

    // Differentiate "nothing found" from "found but invalid" —
    // the previous single-message was confusing because it claimed
    // schemas were "found" even when totalSchemas was 0.
    const failureMessage =
      detailedResult.totalSchemas === 0
        ? 'Schema.org JSON-LD not found'
        : detailedResult.invalidSchemas > 0 && detailedResult.validSchemas === 0
          ? `Schema.org JSON-LD found but all ${detailedResult.invalidSchemas} blocks are invalid`
          : 'Schema.org JSON-LD found but missing important types (Organization, WebSite)';

    return createFailureResult(failureMessage, resultData);

  } catch (error) {
    return createFailureResult('Error validating Schema.org', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

// Export for testing
export type { DetailedSchemaResult };
