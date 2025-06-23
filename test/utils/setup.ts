/**
 * Jest test setup file
 * Configures global test environment for TypeScript tests
 */

import "source-map-support/register";

// Extend Jest matchers if needed
declare global {
  namespace jest {
    interface Matchers<R> {
      // Add custom matchers here if needed
    }
  }
}

// Global test configuration
beforeAll(() => {
  // Set test environment variables
  process.env.NODE_ENV = "test";

  // Suppress console output during tests unless explicitly needed
  if (!process.env.VERBOSE_TESTS) {
    console.log = jest.fn();
    console.info = jest.fn();
    console.warn = jest.fn();
    console.error = jest.fn();
  }
});

afterAll(() => {
  // Cleanup after all tests
});

// Global test utilities
export const testTimeout = 10000;
export const shortTimeout = 5000;
export const longTimeout = 30000;
