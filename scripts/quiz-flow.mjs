// Robust quiz flow tester: parses snapshot text, clicks by ref
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

function clickByLabel(buttons, predicate) {
  const b = buttons.find(predicate);
  if (!b) throw new Error("Button not found: " + JSON.stringify(buttons.map((x) => x.label)));
  run(`agent-browser click @${b.ref}`);
}

// Remaining answers: [optionSubtext, isCorrect]
const PLAN = [
  ["Yellow", true],      // Q4
  ["go", true],          // Q5  (B "go")
  ["It's rainy", true],  // Q6
  ["played", true],      // Q7
  ["Small", true],       // Q8
  ["would", false],      // Q9
  ["for", false],        // Q10
  ["very bad", false],   // Q11
  ["She reads books", false], // Q12
  ["will have completed", true], // Q13
  ["unwilling and hesitant", true], // Q14
  ["was reviewed", true], // Q15
  ["It was delayed", true], // Q16
  ["extremely rare", false], // Q17
  ["had", false],        // Q18
  ["to eat very quickly", false], // Q19
  ["took", false],       // Q20
];

for (let i = 0; i < PLAN.length; i++) {
  const [opt] = PLAN[i];
  let buttons = snap();
  // Click the option (enabled, matches text)
  clickByLabel(
    buttons,
    (b) => !b.disabled && b.label.includes(opt)
  );
  execSync("sleep 0.8");
  buttons = snap();
  const isLast = i === PLAN.length - 1;
  const nextLabel = isLast ? "🎁 شاهد نتيجتك!" : "التالي ←";
  clickByLabel(buttons, (b) => b.label.includes(nextLabel));
  execSync("sleep 1");
}
console.log("ALL 20 ANSWERED — result should be showing");
