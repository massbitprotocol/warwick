module.exports = {
  preset: 'ts-jest/presets/default-esm',
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '',
  testRegex: '.*\\.spec\\.ts$',
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  transformIgnorePatterns: ['<rootDir>/src/node_modules/'],
  moduleNameMapper: {
    '^@massbit/(.*)$': '<rootDir>/src/$1',
    '@substrate/ss58-registry':
      '<rootDir>/node_modules/@substrate/ss58-registry/esm/index.js',
  },
  collectCoverageFrom: ['**/*.(t|j)s'],
  coverageDirectory: '../coverage',
  testEnvironment: 'node',
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
};
