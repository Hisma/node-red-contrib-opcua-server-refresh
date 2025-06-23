/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */

// Modern Jest configuration for TypeScript testing
// Updated for node-red-contrib-opcua-server-refresh

module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest/presets/default',

  // Test environment
  testEnvironment: 'node',

  // Root directories for tests and source
  roots: ['<rootDir>/src', '<rootDir>/test'],

  // Test file patterns - look for .test.ts and .spec.ts files
  testMatch: [
    '**/test/**/*.test.ts',
    '**/test/**/*.spec.ts'
  ],

  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],

  // Module resolution
  moduleDirectories: ['node_modules', '<rootDir>/src'],
  
  // Path mapping to match tsconfig.json
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@types/(.*)$': '<rootDir>/src/types/$1'
  },

  // Coverage configuration
  collectCoverage: false,
  coverageDirectory: 'jcoverage',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**/*',
    '!src/public/**/*'
  ],
  coverageReporters: ['json-summary', 'text', 'lcov', 'html'],
  coveragePathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/test/',
    '<rootDir>/src/public/',
    '<rootDir>/src/types/'
  ],

  // Test setup
  setupFilesAfterEnv: ['<rootDir>/test/utils/setup.ts'],

  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/jcoverage/',
    '<rootDir>/src/public/'
  ],

  // TypeScript configuration for tests
  extensionsToTreatAsEsm: [],
  
  // ts-jest configuration
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'es2020',
        lib: ['es2020'],
        moduleResolution: 'node',
        allowSyntheticDefaultImports: true,
        esModuleInterop: true,
        skipLibCheck: true,
        strict: true,
        resolveJsonModule: true,
        declaration: false,
        sourceMap: true
      }
    }]
  },

  // Test execution settings
  verbose: true,
  bail: false,
  automock: false,
  clearMocks: true,
  restoreMocks: true,

  // Timeout settings
  testTimeout: 10000,

  // Fake timers configuration
  fakeTimers: {
    enableGlobally: false
  },

  // Error handling
  errorOnDeprecated: true,

  // Performance and memory
  maxWorkers: '50%',
  
  // Transform ignore patterns for node_modules
  transformIgnorePatterns: [
    'node_modules/(?!(node-opcua)/)'
  ]
};
