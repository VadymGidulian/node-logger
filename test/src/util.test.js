import * as path from 'node:path';

import {getProjectRoot} from '../../src/util.js';

const testDir = path.join(process.cwd(), 'test');

describe('Util', () => {
	test(`getProjectRoot('src/index.js')`, () => {
		expect(getProjectRoot(path.resolve('test/src/index.js'))).toBe(testDir);
	});
	test(`getProjectRoot('src/util.test.js')`, () => {
		expect(getProjectRoot(path.resolve('test/src/util.test.js'))).toBe(testDir);
	});
	test(`getProjectRoot('node_modules/module-a/index.js')`, () => {
		expect(getProjectRoot(path.resolve('test/node_modules/module-a/index.js')))
			.toBe(path.join(testDir, 'node_modules/module-a'));
	});
	test(`getProjectRoot('../some.file')`, () => {
		const someDirPath  = path.join(testDir, '..');
		const someFilePath = path.join(someDirPath, 'some.file')
		expect(getProjectRoot(someFilePath)).toBe(process.cwd());
	});
});
