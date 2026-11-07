/**
 * SecurityScorecard Node - Version 1 - Zod Schema Factory
 * Exports a factory that unions all discriminator schemas.
 *
 * Schema helpers (z, expressionSchema, etc.) are passed as parameters
 * by the schema-validator, not imported from external files.
 *
 * @generated - CommonJS JavaScript for runtime loading
 */

const getCompanySchema = require('./resource_company/index.schema');
const getIndustrySchema = require('./resource_industry/index.schema');
const getInviteSchema = require('./resource_invite/index.schema');
const getPortfolioSchema = require('./resource_portfolio/index.schema');
const getPortfolioCompanySchema = require('./resource_portfolio_company/index.schema');
const getReportSchema = require('./resource_report/index.schema');

module.exports = function getSchema(helpers) {
  const { parameters, z } = helpers;
  // Apply discriminator default if not set
  const effectiveParams = parameters.resource === undefined ? { ...parameters, resource: 'company' } : parameters;
  return z.union([
    getCompanySchema({ ...helpers, parameters: effectiveParams }),
    getIndustrySchema({ ...helpers, parameters: effectiveParams }),
    getInviteSchema({ ...helpers, parameters: effectiveParams }),
    getPortfolioSchema({ ...helpers, parameters: effectiveParams }),
    getPortfolioCompanySchema({ ...helpers, parameters: effectiveParams }),
    getReportSchema({ ...helpers, parameters: effectiveParams }),
  ]);
};