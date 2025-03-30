// Configuration module for centralized environment variable management

/**
 * Gets an environment variable, with optional validation
 * @param name The name of the environment variable
 * @param defaultValue Optional default value if not found
 * @param required If true, will throw an error when the variable is missing
 * @returns The environment variable value or default value
 */
export function getEnv(name: string, defaultValue?: string, required = false): string {
  const value = process.env[name];
  
  if (required && !value && !defaultValue) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  
  return value || defaultValue || '';
}

/**
 * Environment configuration for the application
 */
export const config = {
  // Server configuration
  port: parseInt(getEnv('PORT', '5000')),
  isDevelopment: getEnv('NODE_ENV', 'development') === 'development',
  
  // Session configuration
  sessionSecret: getEnv('SESSION_SECRET', 'shahbaaz-auditorium-secret-key', true),
  
  // Admin user configuration
  admin: {
    username: getEnv('ADMIN_USERNAME', 'admin'),
    password: getEnv('ADMIN_PASSWORD', 'admin'),
  },
  
  // Database configuration
  database: {
    url: getEnv('DATABASE_URL', '', true),
    host: getEnv('PGHOST', ''),
    port: parseInt(getEnv('PGPORT', '5432')),
    user: getEnv('PGUSER', ''),
    password: getEnv('PGPASSWORD', ''),
    name: getEnv('PGDATABASE', ''),
  },
  
  // Initialize the config and validate required variables
  validate(): void {
    try {
      // Session secret is required and validated in the getter
      this.sessionSecret;
      
      // Warn about default admin credentials in production
      if (!this.isDevelopment && 
         (this.admin.username === 'admin' || this.admin.password === 'admin')) {
        console.warn('⚠️ WARNING: Using default admin credentials in production is a security risk!');
        console.warn('Set ADMIN_USERNAME and ADMIN_PASSWORD environment variables.');
      }
    } catch (error) {
      console.error('❌ Configuration error:', error);
      process.exit(1); // Exit with error code
    }
  }
};

// Validate the configuration on module load
config.validate();