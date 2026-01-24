module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/api/__tests__'],
  testMatch: ['**/?(*.)+(spec|test).[jt]s?(x)'],
  verbose: true,
  maxWorkers: 1,
};
