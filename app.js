// app.js (CommonJS)
require('dotenv').config();
const { spawn } = require("child_process");

const procs = [];

/** 공통 실행 함수 */
function run(name, cmd, args, options = {}) {
  const p = spawn(cmd, args, {
    stdio: "inherit",
    shell: process.platform === "win32", // 맥/리눅스는 false여도 OK
    ...options,
  });
  procs.push(p);
  p.on("exit", (code) => {
    console.log(`\n[${name}] exited with code ${code}`);
    // 하나라도 죽으면 전부 정리하고 종료(개발 중 보기 편함)
    shutdown();
    process.exit(code ?? 0);
  });
  return p;
}

/** 자식 프로세스 정리 */
function shutdown() {
  for (const p of procs) {
    if (!p.killed) {
      try { p.kill("SIGINT"); } catch {}
    }
  }
}

// 종료 시그널 처리
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

// 1) 서버: nodemon으로 변경 감지( server 디렉토리 감시 )
run(
  "server",
  "npx",
  ["nodemon", "--watch", "server", "--ext", "js,json", "server/index.js"]
);

// 2) 클라이언트: CRA 개발 서버 ( client 디렉토리에서 실행 )
run("client", "npm", ["start", "--prefix", "client"], {
  env: {
    ...process.env,
    PORT: process.env.PORT_CLIENT || 3270,
    HOST: process.env.CLIENT_HOST || '0.0.0.0',
  },
});
