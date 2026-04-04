import Groq from 'groq-sdk';
import logger from '@/lib/logger';

interface ApiKeyState {
  key: string;
  inUse: number;
  lastUsed: number;
  consecutiveErrors: number;
  isRateLimited: boolean;
}

class ApiKeyManager {
  private keys: ApiKeyState[] = [];
  private currentIndex = 0;
  private readonly maxConcurrentPerKey = 1;
  private readonly baseDelay = 1000;
  private readonly maxConsecutiveErrors = 2;
  private isInitialized = false;

  constructor() {
    this.initializeKeys();
  }

  initializeKeys(): void {
    this.keys = [];
    
    const keyEnvVars = [
      'GROQ_API_KEY_FOR_DESC_1',
      'GROQ_API_KEY_FOR_DESC_2',
      'GROQ_API_KEY_FOR_DESC_3',
      'GROQ_API_KEY_FOR_DESC_4',
      'GROQ_API_KEY_FOR_DESC_5',
      'GROQ_API_KEY_FOR_DESC_6',
      'GROQ_API_KEY_FOR_DESC_7',
      'GROQ_API_KEY_FOR_DESC_8',
    ];

    for (const envVar of keyEnvVars) {
      const key = process.env[envVar];
      if (key && key.trim() !== '' && !key.startsWith('#')) {
        this.keys.push({
          key,
          inUse: 0,
          lastUsed: 0,
          consecutiveErrors: 0,
          isRateLimited: false,
        });
      }
    }

    if (this.keys.length === 0) {
      const fallback = process.env.GROQ_API_KEY;
      if (fallback && !fallback.startsWith('#')) {
        this.keys.push({
          key: fallback,
          inUse: 0,
          lastUsed: 0,
          consecutiveErrors: 0,
          isRateLimited: false,
        });
      }
    }

    this.isInitialized = true;
    logger.log(`[ApiKeyManager] Loaded ${this.keys.length} API keys`);
  }

  clearAllRateLimits(): void {
    for (const keyState of this.keys) {
      keyState.isRateLimited = false;
      keyState.consecutiveErrors = 0;
    }
    logger.log(`[ApiKeyManager] Cleared all rate limit states`);
  }

  refreshKeys(): void {
    logger.log(`[ApiKeyManager] Refreshing API keys...`);
    this.clearAllRateLimits();
    this.initializeKeys();
  }

  private getAvailableKey(): { key: string; index: number } | null {
    if (this.keys.length === 0) return null;

    const now = Date.now();
    
    // Try to find a non-rate-limited key with capacity
    for (let attempt = 0; attempt < this.keys.length; attempt++) {
      const index = (this.currentIndex + attempt) % this.keys.length;
      const keyState = this.keys[index];

      // Skip keys at capacity
      if (keyState.inUse >= this.maxConcurrentPerKey) {
        continue;
      }

      // For rate-limited keys, check if enough time has passed
      if (keyState.isRateLimited) {
        const timeSinceLastUse = now - keyState.lastUsed;
        if (timeSinceLastUse > 30000) { // 30 second cooldown
          keyState.isRateLimited = false;
          keyState.consecutiveErrors = 0;
          logger.log(`[ApiKeyManager] Key ${index + 1} cooldown complete, available`);
        } else {
          continue;
        }
      }

      this.currentIndex = (index + 1) % this.keys.length;
      keyState.inUse++;
      keyState.lastUsed = now;
      return { key: keyState.key, index };
    }

    return null;
  }

  private releaseKey(index: number): void {
    if (index >= 0 && index < this.keys.length) {
      this.keys[index].inUse = Math.max(0, this.keys[index].inUse - 1);
    }
  }

  private markKeyError(index: number): void {
    if (index >= 0 && index < this.keys.length) {
      this.keys[index].consecutiveErrors++;
      if (this.keys[index].consecutiveErrors >= this.maxConsecutiveErrors) {
        this.keys[index].isRateLimited = true;
        logger.log(`[ApiKeyManager] Key ${index + 1} marked as rate-limited after ${this.maxConsecutiveErrors} errors`);
      }
    }
  }

  private clearKeyError(index: number): void {
    if (index >= 0 && index < this.keys.length) {
      this.keys[index].consecutiveErrors = 0;
      this.keys[index].isRateLimited = false;
    }
  }

  async executeWithRetry<T>(
    operation: (groq: Groq) => Promise<T>,
    options?: {
      maxRetries?: number;
    }
  ): Promise<T> {
    const maxRetries = options?.maxRetries ?? 5;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      // Refresh keys from environment periodically
      if (attempt % 2 === 0) {
        this.refreshKeys();
      }

      const keyInfo = this.getAvailableKey();

      if (!keyInfo) {
        logger.log(`[ApiKeyManager] All keys busy/rate-limited, waiting 3s...`);
        await this.delay(3000);
        continue;
      }

      try {
        const groq = new Groq({ apiKey: keyInfo.key });
        const result = await operation(groq);
        this.releaseKey(keyInfo.index);
        this.clearKeyError(keyInfo.index);
        return result;
      } catch (error: unknown) {
        this.releaseKey(keyInfo.index);
        
        const err = error as { status?: number; code?: string; message?: string };
        const status = err.status;
        const errorMessage = err.message || '';
        
        logger.log(`[ApiKeyManager] Key ${keyInfo.index + 1} error: ${errorMessage}`);

        // Check for different rate limit types
        const isRateLimit = status === 429 || 
          errorMessage.includes('rate limit') ||
          errorMessage.includes('Rate limit') ||
          errorMessage.includes('tokens per day') ||
          errorMessage.includes('tokens per minute') ||
          errorMessage.includes('Too many requests');

        if (isRateLimit) {
          this.markKeyError(keyInfo.index);
          const delay = this.baseDelay * Math.pow(2, Math.min(attempt, 5));
          logger.log(`[ApiKeyManager] Rate limit on key ${keyInfo.index + 1}, waiting ${delay/1000}s...`);
          await this.delay(delay);
        } else if (status && status >= 500) {
          const delay = this.baseDelay * Math.pow(2, attempt);
          logger.log(`[ApiKeyManager] Server error ${status}, waiting ${delay/1000}s...`);
          await this.delay(delay);
        } else if (status === 401 || status === 403) {
          logger.log(`[ApiKeyManager] Auth error - invalid API key`);
          throw error;
        } else {
          this.markKeyError(keyInfo.index);
          throw error;
        }
      }
    }

    throw new Error('All API keys exhausted after maximum retries');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getStats(): { total: number; available: number; inUse: number; rateLimited: number } {
    const inUse = this.keys.reduce((sum, k) => sum + k.inUse, 0);
    const rateLimited = this.keys.filter(k => k.isRateLimited).length;
    return {
      total: this.keys.length,
      available: this.keys.filter(k => !k.isRateLimited && k.inUse < this.maxConcurrentPerKey).length,
      inUse,
      rateLimited,
    };
  }
}

export const apiKeyManager = new ApiKeyManager();
