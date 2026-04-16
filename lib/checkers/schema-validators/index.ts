/**
 * Schema Validators — public API consumed by `schema-checker.ts`.
 *
 * Only re-exports symbols that the production checker uses. Test-only helpers
 * (validateOrganizationsInHtml, isBreadcrumbListResult, etc.) are imported
 * directly from their concrete files in `__tests__/`.
 */

export {
  validateOrganization,
  validateWebSite,
  validateOrganizationAndWebSite,
} from './organization-validator';

export type {
  SchemaValidationResult as OrgSchemaValidationResult,
  OrganizationSchema,
  WebSiteSchema,
} from './organization-validator';

export {
  validateArticleSchema,
  validateArticleSchemas,
} from './article-validator';

export type {
  ArticleSchema,
  ArticleValidationResult,
} from './article-validator';

export {
  validateBreadcrumbList,
  validateWebPage,
  validateLocalBusiness,
} from './other-validators';

export type {
  BreadcrumbListValidationResult as BreadcrumbListResult,
  WebPageValidationResult as WebPageResult,
  LocalBusinessValidationResult as LocalBusinessResult,
  SchemaValidationResult,
} from './other-validators';
