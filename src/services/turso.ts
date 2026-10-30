// Turso Cloud Database Service (Disabled / OFF)
// Turso backend has been turned off as per request.

export const IS_TURSO_ENABLED = false;

export const TURSO_CONFIG = {
  url: '',
  authToken: ''
};

// Safe dummy client so any legacy reference doesn't throw runtime errors
export const tursoClient = {
  execute: async (_query?: any) => {
    return { rows: [] as any[], columns: [] as string[] };
  }
};

/**
 * Initializes the Relational SQLite Schema tables in Turso (Disabled)
 */
export async function initializeTursoSchema(): Promise<boolean> {
  return false;
}

/**
 * Save newly registered driver profile into Turso Relational DB (Disabled)
 */
export async function saveDriverToTurso(_driver: any): Promise<boolean> {
  return false;
}

/**
 * Fetch all registered drivers from Turso (Disabled)
 */
export async function fetchDriversFromTurso(): Promise<any[]> {
  return [];
}

/**
 * Save chat message to Turso database (Disabled)
 */
export async function saveMessageToTurso(_msg: any): Promise<boolean> {
  return false;
}

/**
 * Fetch chat messages from Turso (Disabled)
 */
export async function fetchMessagesFromTurso(_chatId: string): Promise<any[]> {
  return [];
}

/**
 * Save Owner Job Listing to Turso (Disabled)
 */
export async function saveOwnerJobToTurso(_job: any): Promise<boolean> {
  return false;
}
