# 📃 logger

A transparent logger that just logs.

## 🎯 Motivation

This logger is designed to be simple, easy in use, highly configurable, and methodology agnostic.
It uses standard console API, so you don't need to make any changes in your existing code.

## ✨ Features

- Uses standard console API
- Easy in use and requires no changes in existing code
- Highly configurable at any point
- Provides plenty information for custom formatting
- Works with custom methods
- Methodology agnostic

## 📋 Requirements

- Node.js 20.11+ or 22+

## 📝 Usage

```js
import * as logger from '@vadym.gidulian/logger';

// Attach the logger. If the logger is already attached, appends the passed config to the existing one, if any.
logger.attach();
// or
logger.attach(CONFIG);
// or
logger.attach([CONFIG1, CONFIG2]);

const CONFIG = {
    // All options are optional
    
    // Method(s) the config will be applied to.
    method: 'log',
    // or
    method: ['warn', 'error'],
    
    // Path(s)¹ the config will be applied to.
    path: 'src/index.js',
    // or
    path: /^src/,
    // or
    path: {
        glob: 'src/**',
        options: {nocase: true} // Optional options passed to minimatch²
    },
    // or
    path: ['src/index.js', /^src/, {glob: 'src/**'}],
    
    // Disable logging. It may be re-enabled again in subsequent configs.
    disabled: true || false,
    
    // Transform arguments passed to console's method(s)
    transform({
        // Arguments passed to console's method. They might be transformed by previous configs.
        args,
        // Called console's method name.
        method,
        // Original arguments passed to console's method.
        originalArgs,
        // Relative path to the caller file.
        path,
        // A function to prevent logging. All subsequent configs will NOT be processed.
        prevent,
        // Root path.
        rootPath,
        // Stack trace.
        stackTrace
    }) {
        if (originalArgs.includes('secret')) {
            prevent(); // In subsequent configs this data may be obtained via `originalArgs` too, so preventing this
            const maskedArgs = mask(originalArgs);
            console[method](...maskedArgs); // Now we can safely log it again
            return; // It's logged now, so exiting
        }
        
        const newArgs = [`[${new Date().toISOString()}][${path}]`, ...args];
        
        if (method === 'error') {
            newArgs.push(`\n at ${stackTrace.map(String).join('\n    ')}`); // If it's an error, print the full stack trace
        } else if (method === 'warn') {
            newArgs.push(`\n at line ${stackTrace[0].lineNumber}`); // If it's a warn, print just the line number
        } // Otherwise, print nothing
        
        return newArgs;
    }
};

// ---

(function fn() {
    console.log('Log');
    console.debug('Admin\'s password is', 'secret');
    console.warn('Warning');
    console.error('Error');
})();
/*
[1970-01-01T00:00:00.000Z][src/index.js] Log
[1970-01-01T00:00:00.000Z][src/index.js] Admin's password is ********
[1970-01-01T00:00:00.000Z][src/index.js] Warning
 at line 4
[1970-01-01T00:00:00.000Z][src/index.js] Error
 at fn (/.../project/src/index.js:5:10)
    Object.<anonymous> (/.../project/src/index.js:6:3)
*/

// Detach the logger. If the logger will be reattached, the previous config will NOT be restored.
logger.detach();
```
¹ `path` is a relative path from the project root to a caller file. <br>
² [minimatch](https://github.com/isaacs/minimatch).

### Stack trace

The stack trace is an array of stack frames represented by [`CallSite` objects](https://v8.dev/docs/stack-trace-api#customizing-stack-traces).

### Transforming dependency logs

You can customize logs from dependencies by matching their paths:

```js
logger.attach({
    path: /^node_modules\/module/,
    ...
});
```

### Caveats

#### Reusable config

If you would like to extract logger setup into a separate module, this will not work as intended.

Instead, only extract the config. Also, to make it parameterizable, your module can return a function returning the config.

#### Unknown source location

It's not always possible to determine the source location of a console method call.

For example:

```js
new Promise((_, reject) => reject('reason'))
    .catch(reason => console.error(reason)); // index.js:2:27
```

But:

```js
new Promise((_, reject) => reject('reason'))
    .catch(console.error); // empty `stackTrace`
```
