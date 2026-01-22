import {Console}        from 'node:console';
import * as path        from 'node:path';
import {minimatch}      from 'minimatch';
import {getProjectRoot} from './util.js';

const SYMBOL_NAMESPACE = '@vadym.gidulian/logger@v2';
const LOGGER = Symbol.for(SYMBOL_NAMESPACE);
const CALLER = Symbol.for(`${SYMBOL_NAMESPACE}::Caller`);

let originalConsole           = null;
let originalConsoleDescriptor = null;

export function attach(config = []) {
	const moduleRoot = getProjectRoot(getCallerFilename(getStackTrace(attach)));
	
	if (!Array.isArray(config)) config = [config];
	for (const conf of config) {
		conf[CALLER] = {rootPath: moduleRoot};
	}
	
	replaceConsole();
	appendConfig(config);
}

export function detach() {
	if (!isLoggerAttached()) return;

	global.console[LOGGER].restore();
}



function appendConfig(config) {
	if (!isLoggerAttached()) return;
	
	if (!Array.isArray(config)) config = [config];
	
	global.console[LOGGER].config.push(...config);
}

function isLoggerAttached() {
	return global.console.hasOwnProperty(LOGGER);
}

function getCallerFilename(stackTrace) {
	let fileName;
	
	for (let i = 0; !fileName && (i < stackTrace.length); i++) {
		fileName = stackTrace[i].getFileName();
	}
	
	return fileName || '';
}

function getStackTrace(topFrame) {
	const oldFormatter = Error.prepareStackTrace;
	try {
		Error.prepareStackTrace = (_, structuredStackTrace) => {
			const stackTrace = [];
			
			for (const callSite of structuredStackTrace) {
				const fileName = callSite.getFileName();
				if (fileName) {
					if (fileName.startsWith(import.meta.dirname)) continue;
					if (fileName.startsWith('internal')) break;
				}
				
				stackTrace.push(callSite);
			}
			
			return stackTrace;
		};
		
		const container = Object.create(null);
		Error.captureStackTrace(container, topFrame);
		return container.stack;
	} finally {
		Error.prepareStackTrace = oldFormatter;
	}
}

function replaceConsole() {
	if (isLoggerAttached()) return;
	
	originalConsole           = global.console;
	originalConsoleDescriptor = Object.getOwnPropertyDescriptor(global, 'console');
	
	const METHOD_PROXIES = new Map();
	
	const proxy = new Proxy(originalConsole, {
		get(target, propertyKey, receiver) {
			const propertyValue = Reflect.get(target, propertyKey, receiver);
			if ((typeof propertyValue !== 'function')
			    || !(Console.prototype.hasOwnProperty(propertyKey) || target.hasOwnProperty(propertyKey)))
				return propertyValue;
			
			if (!METHOD_PROXIES.has(propertyKey)) {
				METHOD_PROXIES.set(propertyKey, new Proxy(propertyValue, {
					apply(targetFn, thisArg, argArray) {
						let args = argArray.slice();
						
						const stackTrace     = getStackTrace(this.apply);
						const callerFilename = getCallerFilename(stackTrace);
						
						let isDisabled  = false;
						let isPrevented = false;
						for (const conf of Reflect.get(target, LOGGER, receiver).config) {
							const relativePath = callerFilename
								? path.relative(conf[CALLER].rootPath, callerFilename)
								: '';
							
							if (conf.method) {
								const methods = Array.isArray(conf.method) ? conf.method : [conf.method];
								if (!methods.includes(propertyKey)) continue;
							}
							
							if (conf.path) {
								const paths = Array.isArray(conf.path) ? conf.path : [conf.path];
								
								let isMatchFound = false;
								for (const p of paths) {
									if (p instanceof RegExp) {
										if (p.test(relativePath)) {
											isMatchFound = true;
											break;
										}
									} else if (typeof p === 'object') {
										if (minimatch(relativePath, p.glob, p.options)) {
											isMatchFound = true;
											break;
										}
									} else {
										if (p === relativePath) {
											isMatchFound = true;
											break;
										}
									}
								}
								if (!isMatchFound) continue;
							}
							
							if ('disabled' in conf) {
								isDisabled = conf.disabled;
								if (isDisabled) continue;
							}
							
							if (conf.transform) {
								args = conf.transform({
									args,
									method:       propertyKey,
									originalArgs: argArray.slice(),
									path:         relativePath,
									prevent:      () => isPrevented = true,
									rootPath:     conf[CALLER].rootPath,
									stackTrace
								});
								if (isPrevented) return;
							}
						}
						if (isDisabled) return;
						
						return Reflect.apply(targetFn, thisArg, args);
					}
				}));
			}
			
			return METHOD_PROXIES.get(propertyKey);
		}
	});
	proxy[LOGGER] = {
		config:  [],
		restore: restoreOriginalConsole
	};
	
	Object.defineProperty(global, 'console', {
		configurable: true,
		enumerable:   true,
		writable:     true,
		value:        proxy
	});
}

function restoreOriginalConsole() {
	Object.defineProperty(global, 'console', originalConsoleDescriptor);
	delete originalConsole[LOGGER];
}
