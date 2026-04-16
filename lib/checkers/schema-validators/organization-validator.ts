/**
 * Organization Schema Validator
 * Validates JSON-LD Organization structured data
 */

import { extractJsonLdScripts, isValidUrl, findSchemasByType } from './jsonld-utils';
export { findSchemasByType };

// ============================================================================
// Type Definitions
// ============================================================================

export interface SchemaValidationResult {
  readonly type: string;
  readonly score: number;
  readonly found: string[];
  readonly missingRequired: string[];
  readonly missingRecommended: string[];
  readonly errors: string[];
  readonly warnings: string[];
}

export interface OrganizationSchema {
  readonly '@type': string | string[];
  readonly name?: string;
  readonly url?: string;
  readonly logo?: string | { readonly url?: string; readonly '@type'?: string };
  readonly sameAs?: string | readonly string[];
  readonly description?: string;
  readonly contactPoint?: unknown | readonly unknown[];
  readonly address?: unknown | string;
  readonly email?: string;
  readonly telephone?: string;
  readonly foundingDate?: string;
  readonly founder?: unknown | readonly unknown[];
}

export interface WebSiteSchema {
  readonly '@type': string | string[];
  readonly name?: string;
  readonly url?: string;
  readonly description?: string;
  readonly publisher?: string | OrganizationSchema;
  readonly potentialAction?: unknown | readonly unknown[];
  readonly inLanguage?: string;
  readonly copyrightHolder?: string | OrganizationSchema;
}

// ============================================================================
// Constants
// ============================================================================

const ORGANIZATION_REQUIRED_FIELDS = ['name', 'url'] as const;
const ORGANIZATION_RECOMMENDED_FIELDS = ['logo', 'sameAs', 'description', 'contactPoint', 'address'] as const;

const WEBSITE_REQUIRED_FIELDS = ['name', 'url'] as const;
const WEBSITE_RECOMMENDED_FIELDS = ['description', 'publisher', 'potentialAction', 'inLanguage'] as const;

// Field weights for scoring
const FIELD_WEIGHTS = {
  required: 50,    // 50 points total for required fields (25 each)
  recommended: 50, // 50 points total for recommended fields (10 each)
} as const;

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Checks if URL uses HTTPS
 */
function isHttps(url: string): boolean {
  try {
    return url.startsWith('https://');
  } catch {
    return false;
  }
}

/**
 * Safely extracts string value from a field
 */
function getStringValue(value: unknown): string | undefined {
  if (typeof value === 'string') {
    return value;
  }
  return undefined;
}

/**
 * Safely extracts array from a field
 */
function getArrayValue(value: unknown): readonly unknown[] {
  if (Array.isArray(value)) {
    return value;
  }
  if (value !== undefined && value !== null) {
    return [value];
  }
  return [];
}

/**
 * Extracts URL from logo field (can be string or ImageObject)
 */
function getLogoUrl(logo: unknown): string | undefined {
  if (typeof logo === 'string') {
    return logo;
  }
  if (typeof logo === 'object' && logo !== null) {
    const logoObj = logo as { readonly url?: string };
    return logoObj.url;
  }
  return undefined;
}

// ============================================================================
// Organization Validator
// ============================================================================

/**
 * Validates an Organization schema object
 */
export function validateOrganization(schema: OrganizationSchema): SchemaValidationResult {
  const found: string[] = [];
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of ORGANIZATION_REQUIRED_FIELDS) {
    const value = schema[field];
    if (value === undefined || value === null || value === '') {
      missingRequired.push(field);
    } else {
      found.push(field);
      
      // Validate URL format
      if (field === 'url') {
        const urlValue = getStringValue(value);
        if (urlValue && !isValidUrl(urlValue)) {
          errors.push(`url is not a valid URL: "${urlValue}"`);
        } else if (urlValue && !isHttps(urlValue)) {
          warnings.push('url uses HTTP instead of HTTPS');
        }
      }

      // Validate name is not empty
      if (field === 'name') {
        const nameValue = getStringValue(value);
        if (nameValue && nameValue.trim().length === 0) {
          errors.push('name is empty or whitespace only');
        }
      }
    }
  }

  // Check recommended fields
  for (const field of ORGANIZATION_RECOMMENDED_FIELDS) {
    const value = schema[field];
    if (value === undefined || value === null) {
      missingRecommended.push(field);
    } else {
      found.push(field);

      // Field-specific validations
      switch (field) {
        case 'logo': {
          const logoUrl = getLogoUrl(value);
          if (logoUrl) {
            if (!isValidUrl(logoUrl)) {
              errors.push(`logo URL is not valid: "${logoUrl}"`);
            } else if (!isHttps(logoUrl)) {
              warnings.push('Logo URL uses HTTP instead of HTTPS');
            }
          } else {
            warnings.push('logo is present but URL is missing or invalid');
          }
          break;
        }

        case 'sameAs': {
          const sameAsArray = getArrayValue(value);
          if (sameAsArray.length === 0) {
            warnings.push('sameAs is present but empty');
          } else {
            const invalidUrls: string[] = [];
            for (const url of sameAsArray) {
              const urlStr = getStringValue(url);
              if (!urlStr || !isValidUrl(urlStr)) {
                invalidUrls.push(urlStr || String(url));
              }
            }
            if (invalidUrls.length > 0) {
              errors.push(`sameAs contains invalid URLs: ${invalidUrls.join(', ')}`);
            }
            if (!Array.isArray(value)) {
              warnings.push('sameAs should be an array for multiple profiles');
            }
          }
          break;
        }

        case 'description': {
          const descValue = getStringValue(value);
          if (descValue) {
            if (descValue.length < 50) {
              warnings.push('description is too short (recommended: 50-500 characters)');
            } else if (descValue.length > 500) {
              warnings.push('description is very long (recommended: 50-500 characters)');
            }
          }
          break;
        }

        case 'contactPoint': {
          const contactArray = getArrayValue(value);
          if (contactArray.length === 0) {
            warnings.push('contactPoint is present but empty');
          }
          break;
        }

        case 'address': {
          if (typeof value === 'string') {
            if (value.trim().length === 0) {
              warnings.push('address is empty string');
            }
          } else if (typeof value === 'object' && value !== null) {
            const addressObj = value as { readonly '@type'?: string };
            if (!addressObj['@type']) {
              warnings.push('address object should have @type (e.g., "PostalAddress")');
            }
          }
          break;
        }
      }
    }
  }

  // Calculate score
  const score = calculateScore('Organization', found, missingRequired, missingRecommended);

  return {
    type: 'Organization',
    score,
    found,
    missingRequired,
    missingRecommended,
    errors,
    warnings,
  };
}

// ============================================================================
// WebSite Validator
// ============================================================================

/**
 * Validates a WebSite schema object
 */
export function validateWebSite(schema: WebSiteSchema): SchemaValidationResult {
  const found: string[] = [];
  const missingRequired: string[] = [];
  const missingRecommended: string[] = [];
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check required fields
  for (const field of WEBSITE_REQUIRED_FIELDS) {
    const value = schema[field];
    if (value === undefined || value === null || value === '') {
      missingRequired.push(field);
    } else {
      found.push(field);

      // Validate URL format
      if (field === 'url') {
        const urlValue = getStringValue(value);
        if (urlValue && !isValidUrl(urlValue)) {
          errors.push(`url is not a valid URL: "${urlValue}"`);
        } else if (urlValue && !isHttps(urlValue)) {
          warnings.push('url uses HTTP instead of HTTPS');
        }
      }

      // Validate name
      if (field === 'name') {
        const nameValue = getStringValue(value);
        if (nameValue && nameValue.trim().length === 0) {
          errors.push('name is empty or whitespace only');
        }
      }
    }
  }

  // Check recommended fields
  for (const field of WEBSITE_RECOMMENDED_FIELDS) {
    const value = schema[field];
    if (value === undefined || value === null) {
      missingRecommended.push(field);
    } else {
      found.push(field);

      // Field-specific validations
      switch (field) {
        case 'description': {
          const descValue = getStringValue(value);
          if (descValue) {
            if (descValue.length < 50) {
              warnings.push('description is too short (recommended: 50-300 characters)');
            } else if (descValue.length > 300) {
              warnings.push('description is very long (recommended: 50-300 characters)');
            }
          }
          break;
        }

        case 'publisher': {
          if (typeof value === 'string') {
            if (!isValidUrl(value)) {
              warnings.push('publisher as string should be a valid URL referencing an Organization');
            }
          } else if (typeof value === 'object' && value !== null) {
            const pubObj = value as { readonly '@type'?: string };
            if (!pubObj['@type']) {
              warnings.push('publisher object should have @type');
            } else if (pubObj['@type'] !== 'Organization') {
              warnings.push(`publisher @type should be "Organization", got "${pubObj['@type']}"`);
            }
          }
          break;
        }

        case 'potentialAction': {
          const actionArray = getArrayValue(value);
          if (actionArray.length === 0) {
            warnings.push('potentialAction is present but empty');
          } else {
            // Check for SearchAction
            const hasSearchAction = actionArray.some((action) => {
              if (typeof action === 'object' && action !== null) {
                const actionObj = action as { readonly '@type'?: string };
                return actionObj['@type'] === 'SearchAction';
              }
              return false;
            });
            if (!hasSearchAction) {
              warnings.push('Consider adding SearchAction for site search functionality');
            }
          }
          break;
        }

        case 'inLanguage': {
          const langValue = getStringValue(value);
          if (langValue) {
            // Basic BCP 47 language tag validation
            const langRegex = /^[a-zA-Z]{2,3}(-[a-zA-Z]{2,4})?$/;
            if (!langRegex.test(langValue)) {
              warnings.push(`inLanguage "${langValue}" may not be a valid BCP 47 language tag (e.g., "en", "en-US", "th")`);
            }
          }
          break;
        }
      }
    }
  }

  // Calculate score
  const score = calculateScore('WebSite', found, missingRequired, missingRecommended);

  return {
    type: 'WebSite',
    score,
    found,
    missingRequired,
    missingRecommended,
    errors,
    warnings,
  };
}

// findSchemasByType + isSchemaOfType + extractJsonLdScripts live in jsonld-utils.ts
// to avoid duplicated logic. Imported at the top of this file and used directly.

// ============================================================================
// Main Validation Functions
// ============================================================================

/**
 * Validates all Organization schemas found in HTML
 */
export function validateOrganizationsInHtml(html: string): {
  readonly organizations: readonly SchemaValidationResult[];
  readonly found: boolean;
} {
  const scripts = extractJsonLdScripts(html);
  const orgSchemas = findSchemasByType(scripts, 'Organization');

  if (orgSchemas.length === 0) {
    return {
      organizations: [],
      found: false,
    };
  }

  const organizations = orgSchemas.map((schema) =>
    validateOrganization(schema as OrganizationSchema)
  );

  return {
    organizations,
    found: true,
  };
}

/**
 * Validates all WebSite schemas found in HTML
 */
export function validateWebSitesInHtml(html: string): {
  readonly websites: readonly SchemaValidationResult[];
  readonly found: boolean;
} {
  const scripts = extractJsonLdScripts(html);
  const webSiteSchemas = findSchemasByType(scripts, 'WebSite');

  if (webSiteSchemas.length === 0) {
    return {
      websites: [],
      found: false,
    };
  }

  const websites = webSiteSchemas.map((schema) =>
    validateWebSite(schema as WebSiteSchema)
  );

  return {
    websites,
    found: true,
  };
}

/**
 * Validates both Organization and WebSite schemas from pre-parsed JSON-LD scripts.
 * Accepts a pre-parsed scripts array to avoid redundant HTML extraction.
 */
export function validateOrganizationAndWebSite(scripts: readonly unknown[]): {
  readonly organization: {
    readonly found: boolean;
    readonly results: readonly SchemaValidationResult[];
    readonly bestScore: number;
  };
  readonly website: {
    readonly found: boolean;
    readonly results: readonly SchemaValidationResult[];
    readonly bestScore: number;
  };
} {
  // Use pre-parsed scripts — no HTML re-parsing needed
  const orgSchemas = findSchemasByType(scripts, 'Organization');
  const organizations = orgSchemas.map((schema) =>
    validateOrganization(schema as OrganizationSchema)
  );

  const webSiteSchemas = findSchemasByType(scripts, 'WebSite');
  const websites = webSiteSchemas.map((schema) =>
    validateWebSite(schema as WebSiteSchema)
  );

  const orgBestScore = organizations.length > 0
    ? Math.max(...organizations.map((o) => o.score))
    : 0;

  const webBestScore = websites.length > 0
    ? Math.max(...websites.map((w) => w.score))
    : 0;

  return {
    organization: {
      found: organizations.length > 0,
      results: organizations,
      bestScore: orgBestScore,
    },
    website: {
      found: websites.length > 0,
      results: websites,
      bestScore: webBestScore,
    },
  };
}

// ============================================================================
// Scoring
// ============================================================================

/**
 * Calculates validation score based on found and missing fields
 * Uses the actual counts of required and recommended fields for the specific type
 */
function calculateScore(
  type: 'Organization' | 'WebSite',
  found: readonly string[],
  _missingRequired: readonly string[],
  _missingRecommended: readonly string[]
): number {
  const relevantRequiredFields: readonly string[] = type === 'WebSite' ? WEBSITE_REQUIRED_FIELDS : ORGANIZATION_REQUIRED_FIELDS;
  const relevantRecommendedFields: readonly string[] = type === 'WebSite' ? WEBSITE_RECOMMENDED_FIELDS : ORGANIZATION_RECOMMENDED_FIELDS;

  const totalRequired = relevantRequiredFields.length;
  const totalRecommended = relevantRecommendedFields.length;

  // Count how many required fields were actually found
  const requiredFound = found.filter(f => 
    relevantRequiredFields.includes(f)
  ).length;

  // Count how many recommended fields were actually found
  const recommendedFound = found.filter(f => 
    relevantRecommendedFields.includes(f)
  ).length;

  // Calculate required field score (50% weight)
  let requiredScore = 0;
  if (totalRequired > 0) {
    requiredScore = (requiredFound / totalRequired) * FIELD_WEIGHTS.required;
  }

  // Calculate recommended field score (50% weight)
  let recommendedScore = 0;
  if (totalRecommended > 0) {
    recommendedScore = (recommendedFound / totalRecommended) * FIELD_WEIGHTS.recommended;
  }

  // Total score
  const totalScore = Math.round(requiredScore + recommendedScore);
  return Math.min(100, Math.max(0, totalScore));
}

// ============================================================================
// Exports
// ============================================================================

export {
  ORGANIZATION_REQUIRED_FIELDS,
  ORGANIZATION_RECOMMENDED_FIELDS,
  WEBSITE_REQUIRED_FIELDS,
  WEBSITE_RECOMMENDED_FIELDS,
};
