// Database connection utility for Postgres
// Server-side only - cannot be used in client components

import { Pool } from 'pg';

// Database configuration from environment variables
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'keepsakes_user',
  password: process.env.DB_PASS || 'keepsakes_password',
  database: process.env.DB_NAME || 'keepsakes_db',
  // Disable SSL for local development and Docker containers
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
};

// Create connection pool
let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool(dbConfig);
    
    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
    });
  }
  
  return pool;
}

// Helper function to execute queries
export async function query(text: string, params?: any[]): Promise<any> {
  const pool = getPool();
  const start = Date.now();
  
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Helper function to get a client from the pool
export async function getClient() {
  const pool = getPool();
  return await pool.connect();
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Database health check
export async function checkConnection(): Promise<boolean> {
  try {
    // Get a fresh pool to avoid cached connection issues
    const pool = getPool();
    
    // Try to get a client and test the connection
    const client = await pool.connect();
    try {
      const result = await client.query('SELECT NOW()');
      return result.rows.length > 0;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Database connection check failed:', error);
    return false;
  }
}

