import db from '../db.js';

const routingCache = new Map();
const CACHE_TTL = 60000; // 1 minute

/**
 * Gets the physical table path from public.app_resource_routing
 * @param {string} logicalResourceName 
 * @param {string} appId 
 * @returns {Promise<string>}
 */
export async function getTablePath(logicalResourceName, appId = 'railway-maintenance') {
  const cacheKey = `${appId}:${logicalResourceName}`;
  const cached = routingCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.path;
  }

  try {
    const result = await db.query(
      `SELECT physical_schema, physical_table 
       FROM public.app_resource_routing 
       WHERE app_id = $1 
         AND logical_resource_name = $2 
         AND is_active = true
       LIMIT 1`,
      [appId, logicalResourceName]
    );

    if (result.rows.length > 0) {
      const { physical_schema, physical_table } = result.rows[0];
      const fullPath = `${physical_schema}.${physical_table}`;
      routingCache.set(cacheKey, { path: fullPath, timestamp: Date.now() });
      return fullPath;
    }

    // Default fallbacks based on the image and user request
    if (logicalResourceName === 'schedules') return 'operations.operation_plans';
    if (logicalResourceName === 'operation_records') return 'operations.operation_records';
    if (logicalResourceName === 'vehicles') return 'master_data.vehicles';
    if (logicalResourceName === 'machine_types') return 'master_data.machine_types';
    if (logicalResourceName === 'managements_offices') return 'master_data.managements_offices';
    
    console.warn(`No routing found for ${appId}:${logicalResourceName}, using public schema`);
    return `public.${logicalResourceName}`;
  } catch (error) {
    console.error('Error fetching table routing:', error);
    return `public.${logicalResourceName}`;
  }
}
