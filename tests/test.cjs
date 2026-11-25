"use strict";
// 推理强度滑条扩展的测试。档位列表的整理在宿主里（T3 Code Extensions 的 t3xEffortModel），这里只检查脚本。
// 用法：npm test（不依赖任何 npm 包，Node 22+）。
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.join(__dirname, "..");
const read = (p) => fs.readFileSync(path.join(ROOT, p), "utf8");

// 测试按登记顺序在文件末尾依次执行，支持 async。
let passed = 0;
const queue = [];
function test(name, fn) {
  queue.push([name, fn]);
}

// 扩展脚本作为 function(host){…} 的函数体执行，这里只检查能编译。
test("脚本能编译", () => {
  const m = JSON.parse(read("plugin.json"));
  new Function("host", [].concat(m.entries.web).map(read).join("\n;\n"));
});

(async () => {
  for (const [name, fn] of queue) {
    await fn();
    passed += 1;
    console.log(`✓ ${name}`);
  }
  console.log(`\n全部通过（${passed} 项）`);
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
