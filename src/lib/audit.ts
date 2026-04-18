import db from './db';

/**
 * Log an administrative activity for auditing purposes.
 * @param user The name or ID of the user performing the action.
 * @param action The type of action: INSERT, UPDATE, DELETE, etc.
 * @param module The functional module: Finance, Inventory, Customers, etc.
 * @param reference_id A unique ID for the affected record (e.g. TRX-123).
 * @param details A JSON-serializable object containing details about the change.
 */
export async function logActivity(
  user: string,
  action: 'INSERT' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'OTHER',
  module: string,
  reference_id: string | null,
  details: any = null
) {
  try {
    const detailsStr = details ? JSON.stringify(details) : null;
    
    await db.query(
      `INSERT INTO audit_logs (user, action, module, reference_id, details) 
       VALUES (?, ?, ?, ?, ?)`,
      [user || 'Admin', action, module, reference_id, detailsStr]
    );
    
    return true;
  } catch (err) {
    console.error(`[Audit Log Failed] ${module}/${action}:`, err);
    return false;
  }
}
