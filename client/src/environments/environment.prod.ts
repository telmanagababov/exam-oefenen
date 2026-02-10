/**
 * Production environment configuration
 * Used when building for production: ng build (or npm run build)
 * 
 * Uses relative URL since Angular and API are served from the same Express server
 */
export const environment = {
  production: true,
  apiUrl: '/api',
};
