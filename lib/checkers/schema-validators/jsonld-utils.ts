/**
 * JSON-LD Utilities
 * Shared functions for extracting and parsing JSON-LD scripts
 */

// ============================================================================
// Constants
// ============================================================================

const MAX_HTML_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SCRIPTS = 100;
const MAX_SCRIPT_SIZE = 100000; // 100KB per script

// ============================================================================
// Type Definitions
// ============================================================================

export interface JsonLdScript {
  readonly content: unknown;
  readonly raw: string;
}

// ============================================================================
// Extraction Functions
// ============================================================================

/**
 * Internal helper: extracts raw text of all JSON-LD script blocks using
 * string indexOf instead of [\s\S]*? regex to avoid catastrophic backtracking
 * (ReDoS) on malformed or adversarially crafted HTML.
 */
function extractRawBlocks(html: string): readonly string[] {
  if (html.length > MAX_HTML_SIZE) return [];

  const OPEN = '<script';
  const CLOSE = '</script>';
  const TYPE = 'application/ld+json';
  const results: string[] = [];
  let pos = 0;

  while (results.length < MAX_SCRIPTS && pos < html.length) {
    const start = html.indexOf(OPEN, pos);
    if (start === -1) break;

    // Find end of opening tag, verify type attribute before paying parse cost
    const tagEnd = html.indexOf('>', start);
    if (tagEnd === -1) break;
    const tag = html.slice(start, tagEnd + 1);
    if (!tag.includes(TYPE)) {
      pos = tagEnd + 1;
      continue;
    }

    const contentStart = tagEnd + 1;
    const contentEnd = html.indexOf(CLOSE, contentStart);
    if (contentEnd === -1) break;

    const raw = html.slice(contentStart, contentEnd).trim();
    if (raw.length <= MAX_SCRIPT_SIZE) {
      results.push(raw);
    }

    pos = contentEnd + CLOSE.length;
  }

  return results;
}

/**
 * Attempts to parse JSON-LD content with fallback for common non-standard escapes.
 * Some real-world sites (e.g. microsoft.com) emit `\_` which is not a valid JSON
 * escape sequence but is otherwise harmless — strip invalid backslash escapes and retry.
 */
export function safeParseJsonLd(raw: string): unknown {
  try {
    return JSON.parse(raw);
  } catch {
    // Strip invalid backslash escapes: \x where x is not a valid JSON escape char
    // Valid: \" \\ \/ \b \f \n \r \t \uXXXX
    const cleaned = raw.replace(/\\([^"\\/bfnrtu])/g, '$1');
    return JSON.parse(cleaned);
  }
}

/**
 * Extracts all JSON-LD scripts from HTML content
 * Returns parsed objects with safety limits
 */
export function extractJsonLdScripts(html: string): readonly unknown[] {
  const scripts: unknown[] = [];
  for (const raw of extractRawBlocks(html)) {
    try {
      scripts.push(safeParseJsonLd(raw));
    } catch {
      // Invalid JSON even after sanitization, skip
    }
  }
  return scripts;
}

/**
 * Extracts JSON-LD scripts with raw content preserved
 * Useful when you need both parsed and raw versions
 */
export function extractJsonLdScriptsWithRaw(html: string): readonly JsonLdScript[] {
  const scripts: JsonLdScript[] = [];
  for (const raw of extractRawBlocks(html)) {
    try {
      scripts.push({ content: safeParseJsonLd(raw), raw });
    } catch {
      // Invalid JSON even after sanitization, skip
    }
  }
  return scripts;
}

/**
 * Extracts raw JSON-LD script strings without parsing
 * Use when you want to parse manually or validate JSON separately
 */
export function extractRawJsonLdScripts(html: string): readonly string[] {
  return extractRawBlocks(html);
}

// ============================================================================
// Schema Finding Functions
// ============================================================================

/**
 * Finds all schemas of a specific type from parsed JSON-LD scripts
 */
export function findSchemasByType(
  scripts: readonly unknown[],
  typeName: string
): readonly unknown[] {
  const results: unknown[] = [];

  for (const script of scripts) {
    if (typeof script !== 'object' || script === null) {
      continue;
    }

    const scriptObj = script as { 
      readonly '@type'?: string | string[]; 
      readonly '@graph'?: readonly unknown[] 
    };

    // Handle @graph array
    if (scriptObj['@graph'] && Array.isArray(scriptObj['@graph'])) {
      for (const item of scriptObj['@graph']) {
        if (isSchemaOfType(item, typeName)) {
          results.push(item);
        }
      }
    }

    // Handle direct schema
    if (isSchemaOfType(script, typeName)) {
      results.push(script);
    }
  }

  return results;
}

// Schema.org subtype mapping — match parent type when a subtype is found.
// LocalBusiness is intentionally excluded from ORGANIZATION_SUBTYPES because it
// is validated separately with its own stricter requirements (address, geo, etc.)
const ORGANIZATION_SUBTYPES: ReadonlySet<string> = new Set([
  'Corporation',
  'NGO',
  'EducationalOrganization',
  'CollegeOrUniversity',
  'ElementarySchool',
  'HighSchool',
  'MiddleSchool',
  'Preschool',
  'School',
  'GovernmentOrganization',
  'MedicalOrganization',
  'Hospital',
  'NewsMediaOrganization',
  'PerformingGroup',
  'DanceGroup',
  'MusicGroup',
  'TheaterGroup',
  'ResearchOrganization',
  'SportsOrganization',
  'SportsTeam',
  'WorkersUnion',
  'Airline',
  'Consortium',
  'FundingScheme',
  'LibrarySystem',
  'OnlineBusiness',
  'OnlineStore',
  'Project',
  'ResearchProject',
  'FundingAgency',
  'PoliticalParty',
]);

function matchesTypeWithSubtypes(type: string, typeName: string): boolean {
  if (type === typeName) { return true; }
  if (typeName === 'Organization' && ORGANIZATION_SUBTYPES.has(type)) { return true; }
  return false;
}

/**
 * Checks if a schema object is of a specific type (including Schema.org subtypes)
 */
export function isSchemaOfType(schema: unknown, typeName: string): boolean {
  if (typeof schema !== 'object' || schema === null) {
    return false;
  }

  const schemaObj = schema as { readonly '@type'?: string | string[] };
  const types = schemaObj['@type'];

  if (typeof types === 'string') {
    return matchesTypeWithSubtypes(types, typeName);
  }

  if (Array.isArray(types)) {
    return types.some((t) => typeof t === 'string' && matchesTypeWithSubtypes(t, typeName));
  }

  return false;
}

/**
 * Gets all schema types from a parsed script
 */
export function getSchemaTypes(script: unknown): readonly string[] {
  if (typeof script !== 'object' || script === null) {
    return [];
  }

  const types: string[] = [];
  const scriptObj = script as { 
    readonly '@type'?: string | string[];
    readonly '@graph'?: readonly unknown[];
  };

  // Handle @graph
  if (scriptObj['@graph'] && Array.isArray(scriptObj['@graph'])) {
    for (const item of scriptObj['@graph']) {
      types.push(...getSchemaTypes(item));
    }
  }

  // Handle direct type
  const type = scriptObj['@type'];
  if (typeof type === 'string') {
    types.push(type);
  } else if (Array.isArray(type)) {
    types.push(...type);
  }

  return types;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Safely extracts a string value from an object
 */
export function extractString(obj: unknown, key: string): string | undefined {
  if (typeof obj === 'object' && obj !== null) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'string') {
      return value;
    }
  }
  return undefined;
}

/**
 * Safely extracts an array value from an object
 */
export function extractArray(obj: unknown, key: string): readonly unknown[] | undefined {
  if (typeof obj === 'object' && obj !== null) {
    const value = (obj as Record<string, unknown>)[key];
    if (Array.isArray(value)) {
      return value;
    }
  }
  return undefined;
}

/**
 * Safely extracts an object value from an object
 */
export function extractObject(obj: unknown, key: string): Record<string, unknown> | undefined {
  if (typeof obj === 'object' && obj !== null) {
    const value = (obj as Record<string, unknown>)[key];
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return value as Record<string, unknown>;
    }
  }
  return undefined;
}

/**
 * Validates if a string is a valid URL
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Checks if URL uses HTTPS
 */
export function isHttpsUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
