export default {
	collectCoverage:     true,
	collectCoverageFrom: ['<rootDir>/src/**/*.js'],
	testEnvironment:     'node',
	testMatch:           ['<rootDir>/test/**/*.test.js'],
	testTimeout:         60_000,
	verbose:             true
};
