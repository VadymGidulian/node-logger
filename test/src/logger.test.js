import {Console}        from 'node:console';
import {join, relative} from 'node:path';
import * as stream      from 'node:stream';
import {jest}           from '@jest/globals';

import * as logger from '../../src/index.js';

import moduleA from 'module-a';
import moduleB from 'module-b';

const LOG = [];
const fakeStream = new stream.Writable({
	decodeStrings: false,
	write(chunk, encoding, callback) {
		LOG.push(chunk);
		callback(null);
	}
});
const fakeConsole     = new Console(fakeStream);
const originalConsole = global.console;

describe('Logger', () => {
	beforeAll(() => {
		global.console = fakeConsole;
	});
	
	beforeEach(() => {
		LOG.length = 0;
	});
	afterEach(() => {
		logger.detach();
	});
	
	afterAll(() => {
		global.console = originalConsole;
	});
	
	test.each([
		['no config', ,],
		['empty config',              {}],
		['empty array of configs',    []],
		['an array of empty configs', [{}, {}]]
	])('Attach w/ %s', (label, config) => {
		logger.attach(config);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	
	test('Detach w/ attached logger', () => {
		logger.attach();
		logger.detach();
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	test('Detach w/o attached logger', () => {
		logger.detach();
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	
	test('Disabled', () => {
		logger.attach({
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual([]);
	});
	
	test('Disabled for some method', () => {
		logger.attach({
			method:   'debug',
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	test('Disabled for some methods', () => {
		logger.attach({
			method:   ['debug', 'log'],
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'info',
			'warn',
			'error',
			'module b'
		]));
	});
	
	test('Disabled for some path (string)', () => {
		logger.attach({
			path:     'node_modules/module-b/index.js',
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a'
		]));
	});
	test('Disabled for some paths (RegExp)', () => {
		logger.attach({
			path:     /^node_modules/,
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error'
		]));
	});
	test('Disabled for some paths (glob)', () => {
		logger.attach({
			path:     {glob: 'NODE_MODULES/**', options: {nocase: true}},
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error'
		]));
	});
	test('Disabled for some paths (array)', () => {
		logger.attach({
			path: [
				'node_modules/module-a/index.js',
				/module-b/
			],
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error'
		]));
	});
	
	test('Disabled for some methods and paths', () => {
		logger.attach({
			method:   'log',
			path:     {glob: 'node_modules/**'},
			disabled: true
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module b'
		]));
	});
	
	test('Disabled and enabled', () => {
		logger.attach([
			{disabled: true},
			{disabled: false}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	test('Disabled for some paths and methods and enabled all', () => {
		logger.attach([
			{
				method:   'log',
				path:     {glob: 'node_modules/**'},
				disabled: true
			}, {
				method:   'debug',
				disabled: true
			}, {
				disabled: false
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	test('Disabled for some methods and enabled for part of them', () => {
		logger.attach([
			{
				method:   ['debug', 'log'],
				disabled: true
			}, {
				method:   'debug',
				disabled: false
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'info',
			'warn',
			'error',
			'module b'
		]));
	});
	test('Disabled for some paths and enabled for part of them', () => {
		logger.attach([
			{
				path:     {glob: 'node_modules/**'},
				disabled: true
			}, {
				path:     {glob: 'node_modules/module-a/*'},
				disabled: false
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a'
		]));
	});
	test('Disabled for some methods and paths and enabled for part of them', () => {
		logger.attach([
			{
				method:   'debug',
				disabled: true
			}, {
				method:   ['debug', 'log'],
				path:     {glob: 'node_modules/**'},
				disabled: true
			}, {
				method:   'log',
				path:     {glob: 'node_modules/module-a/*'},
				disabled: false
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	
	test('Transformed output', () => {
		logger.attach({
			transform({args}) {
				return [`[${new Date(0).toISOString()}]`, ...args];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'[1970-01-01T00:00:00.000Z] debug',
			'[1970-01-01T00:00:00.000Z] log',
			'[1970-01-01T00:00:00.000Z] info',
			'[1970-01-01T00:00:00.000Z] warn',
			'[1970-01-01T00:00:00.000Z] error',
			'[1970-01-01T00:00:00.000Z] module a',
			'[1970-01-01T00:00:00.000Z] module b'
		]));
	});
	test('Transformed output for some methods', () => {
		logger.attach({
			method: 'error',
			transform({args}) {
				return ['!', ...args];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'! error',
			'module a',
			'module b'
		]));
	});
	test('Transformed output for some paths', () => {
		logger.attach({
			path: /node_modules/,
			transform({args}) {
				return ['[DEPENDENCY]', ...args];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'[DEPENDENCY] module a',
			'[DEPENDENCY] module b'
		]));
	});
	test('Transformed output for some methods and paths', () => {
		logger.attach({
			method: 'warn',
			path:   /node_modules/,
			transform({args}) {
				return ['! [DEPENDENCY]', ...args];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'! [DEPENDENCY] module b'
		]));
	});
	
	test('Transformed output for methods dynamically', () => {
		logger.attach({
			transform({args, method}) {
				return [
					({
						 debug: `[🔹DEBUG]`,
						 info:  `[ℹ️ INFO]`,
						 warn:  `[⚠️ WARN]`,
						 error: `[‼️ ERROR]`
					 }[method] || `[${method.toUpperCase()}]`),
					...args
				];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'[🔹DEBUG] debug',
			'[LOG] log',
			'[ℹ️ INFO] info',
			'[⚠️ WARN] warn',
			'[‼️ ERROR] error',
			'[LOG] module a',
			'[⚠️ WARN] module b'
		]));
	});
	test('Transformed output for paths dynamically', () => {
		logger.attach({
			transform({args, path}) {
				return [`[${path}]`, ...args];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'[src/logger.test.js] debug',
			'[src/logger.test.js] log',
			'[src/logger.test.js] info',
			'[src/logger.test.js] warn',
			'[src/logger.test.js] error',
			'[node_modules/module-a/index.js] module a',
			'[node_modules/module-b/index.js] module b'
		]));
	});
	test('Transformed output for root paths dynamically', () => {
		logger.attach({
			transform({args, rootPath}) {
				return [`[${rootPath}]`, ...args];
			}
		});
		
		const rootPath = join(import.meta.dirname, '..');
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			`[${rootPath}] debug`,
			`[${rootPath}] log`,
			`[${rootPath}] info`,
			`[${rootPath}] warn`,
			`[${rootPath}] error`,
			`[${rootPath}] module a`,
			`[${rootPath}] module b`
		]));
	});
	test('Transformed output with stack trace info', () => {
		logger.attach({
			transform({args, rootPath, stackTrace}) {
				// Filter out Jest
				const ignoredPath = join(import.meta.dirname, '..', '..', 'node_modules');
				for (let i = 0; i < stackTrace.length; i++) {
					if (stackTrace[i].getFileName().includes(ignoredPath)) {
						stackTrace.length = i;
						break;
					}
				}
				
				return [
					...args,
					`\nat ${stackTrace
						.map(frame => `${relative(rootPath, frame.getFileName())}::${frame.getFunctionName() || '<anonymous>'}`)
						.join('\n   ')}`
				];
			}
		});
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			[
				'debug ',
			    'at src/logger.test.js::print',
			    '   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'log ',
			    'at src/logger.test.js::print',
			    '   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'info ',
			    'at src/logger.test.js::print',
			    '   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'warn ',
			    'at src/logger.test.js::print',
			    '   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'error ',
			    'at src/logger.test.js::print',
			    '   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'module a ',
				'at node_modules/module-a/index.js::default',
				'   src/logger.test.js::useModules',
				'   src/logger.test.js::print',
				'   src/logger.test.js::<anonymous>'
			].join('\n'),
			[
				'module b ',
				'at node_modules/module-b/index.js::default',
				'   src/logger.test.js::useModules',
				'   src/logger.test.js::print',
				'   src/logger.test.js::<anonymous>'
			].join('\n')
		]));
	});
	
	test('Disabled configs shouldn\'t transform output', () => {
		const transform = jest.fn(({args}) => ['!', ...args]);
		
		logger.attach([
			{
				disabled: true,
				transform
			}, {
				method:   'log',
				disabled: true,
				transform
			}, {
				path:     {glob: 'node_modules/**'},
				disabled: true,
				transform
			}, {
				method:   ['warn', 'error'],
				path:     {glob: 'src/*'},
				disabled: false,
				transform
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'! warn',
			'! error'
		]));
		expect(transform).toHaveBeenCalledTimes(2);
	});
	
	test('Original args', () => {
		logger.attach([
			{
				path: {glob: 'node_modules/**'},
				transform({args}) {
					return [`${new Date(0).toLocaleDateString()}:`, ...args]; // 1/1/1970: ...
				}
			}, {
				path: {glob: 'node_modules/**'},
				transform({originalArgs}) {
					return [`[${new Date(0).toISOString()}]`, ...originalArgs]; // [1970-01-01T00:00:00.000Z] ...
				}
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'[1970-01-01T00:00:00.000Z] module a',
			'[1970-01-01T00:00:00.000Z] module b'
		]));
	});
	test('Original args should be immutable', () => {
		logger.attach([
			{
				transform({args}) {
					args.unshift('!');
					return args;
				}
			}, {
				transform({originalArgs}) {
					originalArgs.unshift('!');
					return originalArgs;
				}
			}, {
				transform({originalArgs}) {
					return originalArgs;
				}
			}
		]);
		
		print();
		
		expect(LOG).toStrictEqual(_n([
			'debug',
			'log',
			'info',
			'warn',
			'error',
			'module a',
			'module b'
		]));
	});
	
	test('Console\'s custom methods', () => {
		console.superlog1 = function (...args) {
			this.log('✨', ...args, '✨');
		};
		
		logger.attach({
			method: ['superlog1', 'superlog2'],
			transform({args}) {
				return ['!', ...args];
			}
		});
		
		console.superlog2 = function (...args) {
			this.log('🔥', ...args, '🔥');
		};
		
		console.superlog1('superlog 1');
		console.superlog2('superlog 2');
		
		expect(LOG).toStrictEqual(_n([
			'✨ ! superlog 1 ✨',
			'🔥 ! superlog 2 🔥'
		]));
	});
	test('Console\'s custom methods (Symbol)', () => {
		const superlog1 = Symbol('superlog1');
		const superlog2 = Symbol('superlog2');
		
		console[superlog1] = function (...args) {
			this.log('✨', ...args, '✨');
		};
		
		logger.attach({
			method: [superlog1, superlog2],
			transform({args}) {
				return ['!', ...args];
			}
		});
		
		console[superlog2] = function (...args) {
			this.log('🔥', ...args, '🔥');
		};
		
		console[superlog1]('superlog 1');
		console[superlog2]('superlog 2');
		
		expect(LOG).toStrictEqual(_n([
			'✨ ! superlog 1 ✨',
			'🔥 ! superlog 2 🔥'
		]));
	});
	
	test('Prevent logging', () => {
		let subsequentConfigsWasIgnored = true;
		
		logger.attach([
			{
				transform({args, prevent}) {
					if (args[0] === 'secret') return prevent();
					return args;
				}
			}, {
				transform({args}) {
					if (args[0] === 'secret') subsequentConfigsWasIgnored = false;
					return args;
				}
			}
		]);
		
		console.log('1');
		console.log('secret');
		console.log('3');
		
		expect(LOG).toStrictEqual(_n([
			'1',
			'3'
		]));
		expect(subsequentConfigsWasIgnored).toBe(true);
	});
});



function print() {
	console.debug('debug');
	console.log('log');
	console.info('info');
	console.warn('warn');
	console.error('error');
	
	useModules();
	
	
	
	function useModules() {
		moduleA();
		moduleB();
	}
}

function _n(array) {
	return array.map(s => s + '\n');
}
