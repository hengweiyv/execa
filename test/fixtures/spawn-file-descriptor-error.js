import assert from 'node:assert/strict';
import childProcess, {ChildProcess} from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import process from 'node:process';
import {execa} from '../../index.js';

const [code, rejectString] = process.argv.slice(2);
const shouldReject = rejectString === 'true';
const spawnError = Object.assign(new Error(`spawn node ${code}`), {code});

// Node emits these errors before initializing the subprocess streams.
childProcess.spawn = () => {
	const subprocess = new ChildProcess();
	process.nextTick(() => subprocess.emit('error', spawnError));
	return subprocess;
};

syncBuiltinESMExports();

const subprocess = execa(process.execPath, ['--version'], {reject: shouldReject, input: 'input', all: true});
assert.ok(subprocess instanceof Promise);
assert.ok(subprocess.stdout);
assert.ok(subprocess.all);

if (shouldReject) {
	await assert.rejects(subprocess, {name: 'ExecaError', code, cause: spawnError});
} else {
	const result = await subprocess;
	assert.equal(result.code, code);
	assert.equal(result.cause, spawnError);
	assert.equal(result.failed, true);
}

console.log(code);
