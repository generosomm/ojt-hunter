// Template filling. Pure functions (no imports) so `npm test` can run them directly.
// {{x}} = required: unknown shows a visible [x] marker. {{x?}} = optional: the line disappears when empty.

export type Values = Record<string, string | number | null | undefined>;
export type Draft = { subject: string | null; body: string; missing: string[] };

const empty = (v: unknown) => v == null || String(v).trim() === "";
const human = (key: string) => key.replaceAll("_", " ");
const noEmDash = (s: string) => s.replace(/\s*—\s*/g, ", ");

function render(text: string, values: Values, missing: Set<string>) {
  const lines = text.split("\n").filter((line) => {
    const optional = [...line.matchAll(/\{\{(\w+)\?\}\}/g)].map((m) => m[1]);
    return !optional.some((k) => empty(values[k]));
  });
  const out = lines
    .join("\n")
    .replace(/\{\{(\w+)(\??)\}\}/g, (_, key: string) => {
      const v = values[key];
      if (!empty(v)) return String(v).trim();
      missing.add(human(key));
      return `[${human(key)}]`;
    });
  return noEmDash(out).replace(/\n{3,}/g, "\n\n").trim();
}

export function fill(template: { subject: string | null; body: string }, values: Values): Draft {
  const missing = new Set<string>();
  const subject = template.subject == null ? null : render(template.subject, values, missing);
  const body = render(template.body, values, missing);
  return { subject, body, missing: [...missing] };
}

type RoleFacts = {
  required_hours_min: number | null;
  required_hours_max: number | null;
  allowance_status: string;
  accepts_nov_start: string;
  setup: string;
  partnership_status: string | null;
};
type Student = { requiredHours: number; maxHours: number; availableFrom: string | null; campus: string };

const PARTNER = ["listed_in_hte", "confirmed_by_school", "confirmed_by_company"];

function monthName(isoDate: string | null) {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  return Number.isNaN(d.getTime()) ? null : d.toLocaleDateString("en-US", { month: "long" });
}

// ask only about essentials the role leaves unknown or that clash with the student's needs
export function buildQuestions(role: RoleFacts, me: Student) {
  const q: string[] = [];
  const { required_hours_min: min, required_hours_max: max } = role;
  if (min == null && max == null) {
    q.push(`Can I do my ${me.requiredHours}-hour OJT with you?`);
  } else if ((min != null && min > me.maxHours) || (max != null && max < me.requiredHours)) {
    const asked = min != null && max != null && min !== max ? `${min} to ${max}` : String(min ?? max);
    q.push(`The post mentions ${asked} hours. My school requires ${me.requiredHours}${me.maxHours > me.requiredHours ? ` and I can extend to ${me.maxHours}` : ""}. Would that work?`);
  }
  if (role.allowance_status === "not_disclosed") q.push("Is there an internship allowance, and how much is it per day or per month?");
  if (role.accepts_nov_start === "ask") {
    const month = monthName(me.availableFrom);
    q.push(month ? `Can I start in ${month}?` : "When is the next intake?");
  }
  if (role.setup === "unknown") q.push("Is it onsite or hybrid? Fully remote is not allowed for our OJT.");
  if (!PARTNER.includes(role.partnership_status ?? "")) {
    q.push(`Do you require an existing MOA with our campus (${me.campus}), or can you accommodate a new school partnership?`);
  }
  return q.length ? `A few quick questions:\n${q.map((x) => `- ${x}`).join("\n")}` : "";
}

// e.g. "Email subject: Facebook: [Position] Intern_[Full Name]"
export function employerSubject(instructions: string | null, role: string, fullName: string) {
  const m = instructions?.match(/subject:\s*(.+)$/im);
  if (!m) return null;
  // "[Position] Intern_" with a title that already ends in "Intern" would say it twice
  const position = /\[Position\]\s+Intern/i.test(m[1]) ? role.replace(/\s+Intern$/i, "") : role;
  return m[1].trim().replace(/\[Position\]/gi, position).replace(/\[Full Name\]/gi, fullName || "[full name]");
}

// don't stuff every project into every letter: first two lines only
export function projectsBlock(projects: string | null) {
  const lines = (projects ?? "").split("\n").map((l) => l.trim()).filter(Boolean).slice(0, 2);
  return lines.length ? `A few things I've worked on:\n${lines.map((l) => `- ${l}`).join("\n")}` : "";
}
