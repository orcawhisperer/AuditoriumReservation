/**
 * Password utility module for secure password generation and handling
 */
import { hash, compare } from "bcrypt";
import { randomBytes } from "crypto";

// Number of rounds for bcrypt
const SALT_ROUNDS = 10;

/**
 * Generate a secure random password
 * @param length Length of the password to generate
 * @returns A secure random password
 */
export function generateSecurePassword(length = 12): string {
  // Generate random bytes and convert to a password-friendly string
  const validChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()";
  const bytes = randomBytes(length);
  
  let password = '';
  for (let i = 0; i < length; i++) {
    // Map each byte to a character in our valid character set
    password += validChars[bytes[i] % validChars.length];
  }

  return password;
}

/**
 * Hash a password using bcrypt
 * @param password Plain text password to hash
 * @returns Promise resolving to the hashed password
 */
export async function hashPassword(password: string): Promise<string> {
  return await hash(password, SALT_ROUNDS);
}

/**
 * Compare a plain text password with a hashed password
 * @param plaintext Plain text password to check
 * @param hashed Hashed password to compare against
 * @returns Promise resolving to true if passwords match
 */
export async function comparePasswords(plaintext: string, hashed: string): Promise<boolean> {
  return await compare(plaintext, hashed);
}