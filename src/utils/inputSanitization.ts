/**
 * Input sanitization utilities for security
 */

// Sanitize text input by removing potentially dangerous characters
export const sanitizeText = (input: string, maxLength: number = 255): string => {
  if (!input || typeof input !== 'string') return '';
  
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>'"]/g, '') // Remove basic XSS vectors
    .replace(/javascript:/gi, '') // Remove javascript: protocols
    .replace(/on\w+=/gi, ''); // Remove event handlers
};

// Sanitize wallet address format
export const sanitizeWalletAddress = (address: string): string => {
  if (!address || typeof address !== 'string') return '';
  
  // Remove whitespace and ensure hex format
  const cleaned = address.trim().toLowerCase();
  
  // Must be 42 characters and start with 0x
  if (!/^0x[a-f0-9]{40}$/.test(cleaned)) {
    throw new Error('Invalid wallet address format');
  }
  
  return cleaned;
};

// Sanitize numeric input
export const sanitizeNumber = (
  input: string | number, 
  min: number = 0, 
  max: number = Number.MAX_SAFE_INTEGER
): number => {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(num) || !isFinite(num)) {
    throw new Error('Invalid numeric input');
  }
  
  if (num < min || num > max) {
    throw new Error(`Number must be between ${min} and ${max}`);
  }
  
  return Math.floor(num); // Ensure integer for chip amounts
};

// Sanitize game type
export const sanitizeGameType = (gameType: string): string => {
  if (!gameType || typeof gameType !== 'string') {
    throw new Error('Game type is required');
  }
  
  const allowedGameTypes = [
    'tetris', 'snake', 'pacman', 'asteroids', 'breakout',
    'frogger', 'mario', 'flipper', 'kingkong',
    'tetris-3d', 'snake-3d', 'pacman-3d', 'asteroids-3d',
    'breakout-3d', 'frogger-3d', 'mario-3d', 'flipper-3d', 'kingkong-3d'
  ];
  
  const sanitized = gameType.trim().toLowerCase().replace(/[^a-z0-9-]/g, '');
  
  if (!allowedGameTypes.includes(sanitized)) {
    throw new Error('Invalid game type');
  }
  
  return sanitized;
};

// Sanitize transaction reference
export const sanitizeTransactionRef = (ref: string): string => {
  if (!ref || typeof ref !== 'string') return '';
  
  return ref
    .trim()
    .slice(0, 100)
    .replace(/[^a-zA-Z0-9_-]/g, ''); // Only allow alphanumeric, underscore, dash
};

// Validate and sanitize user input for operations
export interface SanitizedOperation {
  gameType?: string;
  amount: number;
  overAmount?: number;
  transactionRef?: string;
}

export const sanitizeOperationInput = (input: {
  gameType?: string;
  amount?: string | number;
  overAmount?: string | number;
  transactionRef?: string;
}): SanitizedOperation => {
  const result: SanitizedOperation = {
    amount: sanitizeNumber(input.amount || 0, 0, 1000) // Max 1000 chips per operation
  };
  
  if (input.gameType) {
    result.gameType = sanitizeGameType(input.gameType);
  }
  
  if (input.overAmount !== undefined) {
    result.overAmount = sanitizeNumber(input.overAmount, 0, 10000); // Max 10k OVER per operation
  }
  
  if (input.transactionRef) {
    result.transactionRef = sanitizeTransactionRef(input.transactionRef);
  }
  
  return result;
};

// Rate limiting check (simple in-memory for client-side)
const operationTimestamps = new Map<string, number[]>();

export const checkRateLimit = (
  operation: string, 
  maxOperations: number = 5, 
  windowMs: number = 60000
): boolean => {
  const now = Date.now();
  const key = operation;
  const timestamps = operationTimestamps.get(key) || [];
  
  // Remove old timestamps outside the window
  const recentTimestamps = timestamps.filter(time => now - time < windowMs);
  
  if (recentTimestamps.length >= maxOperations) {
    return false; // Rate limit exceeded
  }
  
  // Add current timestamp
  recentTimestamps.push(now);
  operationTimestamps.set(key, recentTimestamps);
  
  return true;
};