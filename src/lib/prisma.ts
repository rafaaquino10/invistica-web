/**
 * Prisma compatibility stub.
 *
 * The frontend no longer connects directly to the database.
 * All data comes from the InvestIQ FastAPI backend.
 * isDemoMode is always true so legacy code paths that check it
 * will use the API-based data source instead of Prisma.
 */

export const isDemoMode = true

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const prisma: any = null
