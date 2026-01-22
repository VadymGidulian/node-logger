import {Console}          from 'node:console';
import {MinimatchOptions} from 'minimatch';

declare namespace Logger {
	
	type MethodsOf<T> = keyof Omit<T, {
		[K in keyof T]: T[K] extends Function ? never : K
	}[keyof T]>;
	
	export type ConsoleMethod = Exclude<MethodsOf<Console>, 'Console'>;
	export type MinimatchPath = {glob: string, options?: MinimatchOptions};
	export type Path          = string | RegExp | MinimatchPath;
	
	export interface Config {
		/**
		 * Method(s) the config will be applied to.
		 */
		method?: ConsoleMethod | ConsoleMethod[];
		/**
		 * Path(s) the config will be applied to.
		 */
		path?: Path | Array<Path>;
		/**
		 * Disable logging. It may be re-enabled again in subsequent configs.
		 */
		disabled?: boolean;
		/**
		 * Transform arguments passed to console's method(s).
		 * @param args - Arguments passed to console's method. They might be transformed by previous configs.
		 * @param method - Called console's method name.
		 * @param originalArgs - Original arguments passed to console's method.
		 * @param path - Relative path to the caller file.
		 * @param prevent - A function to prevent logging. All subsequent configs will NOT be processed.
		 * @param rootPath - Root path.
		 * @param stackTrace - Stack trace.
		 */
		transform?: ({
			args, method, originalArgs, path, prevent, rootPath, stackTrace
		}: {
			args:         any[],
			method:       string,
			originalArgs: any[],
			path:         string,
			prevent:      () => void,
			rootPath:     string,
			stackTrace:   NodeJS.CallSite[]
		}) => any[];
	}
	
}

/**
 * Attach the logger.
 *
 * If the logger is already attached, appends the passed config to the existing one, if any.
 * @param config - Logger config
 */
export declare function attach(config?: Logger.Config|Logger.Config[]): void;

/**
 * Detach the logger.
 *
 * If the logger will be reattached, the previous config will NOT be restored.
 */
export declare function detach(): void;
