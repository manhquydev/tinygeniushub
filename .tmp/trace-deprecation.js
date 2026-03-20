const { spawn } = require('node:child_process');

const child = spawn('cmd', ['/c', 'set NODE_OPTIONS=--trace-deprecation&& pnpm exec next start --port 3011'], {
  cwd: 'D:/project/cungcontuhoc',
  stdio: ['ignore', 'pipe', 'pipe'],
});

let out = '';
let err = '';
child.stdout.on('data', (d) => { out += d.toString(); });
child.stderr.on('data', (d) => { err += d.toString(); });

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

(async () => {
  try {
    await sleep(9000);
    try {
      await fetch('http://127.0.0.1:3011/kid');
      console.log('request-ok');
    } catch (e) {
      console.log('request-failed', e?.message || String(e));
    }
    await sleep(2000);
  } finally {
    child.kill('SIGTERM');
    await sleep(1000);
    if (!child.killed) child.kill('SIGKILL');
    console.log('---STDOUT---');
    console.log(out);
    console.log('---STDERR---');
    console.log(err);
  }
})();
