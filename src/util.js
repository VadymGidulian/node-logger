import * as fs   from 'node:fs';
import * as path from 'node:path';

export function getProjectRoot(entryFile) {
	const entryDir = path.dirname(entryFile);
	const {root}   = path.parse(entryDir);
	
	// Rely on `package.json`
	let dir = entryDir;
	while (!isPackageJsonIn(dir)) {
		dir = path.join(dir, '..');
		if (dir === root) return entryDir;
	}
	return dir;
	
	
	
	function isPackageJsonIn(dir) {
		try {
			fs.accessSync(path.join(dir, 'package.json'));
			return true;
		} catch {
			return false;
		}
	}
}
