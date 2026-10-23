// Run: npm test   (Node 24 runs TypeScript directly)
import { test } from "node:test";
import assert from "node:assert/strict";
import { buildQuestions, employerSubject, fill, projectsBlock } from "../../../lib/fill.ts";

test("known values fill in, unknown required ones show a visible marker", () => {
  const out = fill({ subject: "{{role}} application, {{full_name}}", body: "Hi {{company}},\nI'm {{full_name}} from {{school}}." }, { role: "IT Intern", company: "Acme", full_name: "", school: "NU" });
  assert.equal(out.subject, "IT Intern application, [full name]");
  assert.equal(out.body, "Hi Acme,\nI'm [full name] from NU.");
  assert.deepEqual(out.missing, ["full name"]);
});

test("optional placeholders drop their whole line when empty", () => {
  const out = fill({ subject: null, body: "Thanks,\nAna\n{{phone?}}\nPortfolio: {{portfolio_url?}}\n{{email}}" }, { phone: "", portfolio_url: null, email: "a@b.c" });
  assert.equal(out.body, "Thanks,\nAna\na@b.c");
  assert.deepEqual(out.missing, []);
});

test("blank lines left behind collapse, and em dashes never reach the draft", () => {
  const out = fill({ subject: null, body: "A\n\n{{questions?}}\n\nB — C" }, { questions: "" });
  assert.equal(out.body, "A\n\nB, C");
});

test("questions only ask about what the role leaves unknown", () => {
  const all = buildQuestions(
    { required_hours_min: null, required_hours_max: null, allowance_status: "not_disclosed", accepts_nov_start: "ask", setup: "unknown", partnership_status: "not_listed" },
    { requiredHours: 600, maxHours: 800, availableFrom: "2026-11-10", campus: "NU Laguna" },
  );
  assert.match(all, /^A few quick questions:/);
  assert.match(all, /600-hour/);
  assert.match(all, /allowance/);
  assert.match(all, /November/);
  assert.match(all, /onsite or hybrid/);
  assert.match(all, /NU Laguna/);

  const none = buildQuestions(
    { required_hours_min: 600, required_hours_max: 600, allowance_status: "disclosed", accepts_nov_start: "yes", setup: "hybrid", partnership_status: "listed_in_hte" },
    { requiredHours: 600, maxHours: 800, availableFrom: "2026-11-10", campus: "NU Laguna" },
  );
  assert.equal(none, "");
});

test("hours outside the student's range become a question, inside does not", () => {
  const q = buildQuestions(
    { required_hours_min: 900, required_hours_max: null, allowance_status: "disclosed", accepts_nov_start: "yes", setup: "onsite", partnership_status: "listed_in_hte" },
    { requiredHours: 600, maxHours: 800, availableFrom: null, campus: "NU Laguna" },
  );
  assert.match(q, /900/);
  const ok = buildQuestions(
    { required_hours_min: 800, required_hours_max: null, allowance_status: "disclosed", accepts_nov_start: "yes", setup: "onsite", partnership_status: "listed_in_hte" },
    { requiredHours: 600, maxHours: 800, availableFrom: null, campus: "NU Laguna" },
  );
  assert.equal(ok, "");
});

test("employer subject format is followed when the post gives one", () => {
  assert.equal(
    employerSubject("Email subject: Facebook: [Position] Intern_[Full Name]", "Software Development & QA Trainee", "Ana Cruz"),
    "Facebook: Software Development & QA Trainee Intern_Ana Cruz",
  );
  // the role title already ends in "Intern": don't say it twice
  assert.equal(
    employerSubject("Email subject: Facebook: [Position] Intern_[Full Name]", "Software Development & QA Trainee Intern", "Ana Cruz"),
    "Facebook: Software Development & QA Trainee Intern_Ana Cruz",
  );
  assert.equal(employerSubject("Apply on the portal.", "Role", "Ana"), null);
  assert.equal(employerSubject(null, "Role", "Ana"), null);
});

test("projects use at most the first two lines, never the whole list", () => {
  assert.equal(projectsBlock("One\n\nTwo\nThree"), "A few things I've worked on:\n- One\n- Two");
  assert.equal(projectsBlock("  "), "");
});
