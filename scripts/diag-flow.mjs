// Answer diagnostic: mostly B (one A) → expect B1-B2 outcome (برنامج المحادثة)
import { execSync } from "child_process";

function run(cmd) {
  return execSync(cmd, { encoding: "utf8", timeout: 30000 });
}
function snap() {
  const out = run("agent-browser snapshot -i");
  const buttons = [];
  for (const line of out.split("\n")) {
    const m = line.match(/- button "([^"]+)"(?: \[disabled\])? \[ref=(e\d+)\]/);
    if (m) buttons.push({ label: m[1], ref: m[2], disabled: /disabled/.test(line) });
  }
  return buttons;
}
function clickBy(buttons, pred) {
  const b = buttons.find(pred);
  if (!b) throw new Error("not found: " + JSON.stringify(buttons.map((x) => x.label)));
  run(`agent-browser click @${b.ref}`);
}

// answers: B, B, A, B, B → mostly B
const PLAN = [
  ["أفهم الفكرة العامة", "التالي"],
  ["أتحدث بثقة", "التالي"],
  ["أتجنب قراءتها", "التالي"],
  ["أستطيع الكتابة", "التالي"],
  ["الرغبة في تطوير مهارات المحادثة", "شاهد نتيجتك"],
];

for (const [opt, next] of PLAN) {
  clickBy(snap(), (b) => !b.disabled && b.label.includes(opt));
  execSync("sleep 0.7");
  clickBy(snap(), (b) => b.label.includes(next));
  execSync("sleep 1");
}
console.log("DIAGNOSTIC DONE");
