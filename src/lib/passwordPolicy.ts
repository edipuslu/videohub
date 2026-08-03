/**
 * VideoHub password rules.
 *
 * Shared by the browser (live feedback while typing) and the server (the
 * check that actually counts — the client can always be bypassed).
 */

export const PASSWORD_MIN_LENGTH = 10;

/** Passwords people reach for first, which are exactly the ones attackers try first. */
const WEAK_PATTERNS = [
  "password",
  "passw0rd",
  "123456",
  "12345678",
  "qwerty",
  "qwertz",
  "azerty",
  "letmein",
  "welcome",
  "admin",
  "iloveyou",
  "monkey",
  "dragon",
  "abc123",
  "111111",
  "000000",
  "sunshine",
  "princess",
  "football",
  "baseball",
  "videohub",
  "usludigital",
  "uslu",
];

export interface PasswordCheck {
  id: string;
  label: string;
  ok: boolean;
}

export interface PasswordAssessment {
  checks: PasswordCheck[];
  /** 0–4, for the strength meter. */
  score: number;
  label: "Too weak" | "Weak" | "Fair" | "Strong" | "Very strong";
  /** Null when the password is acceptable, otherwise why it was rejected. */
  error: string | null;
}

/** Extra context so a password can't just echo the account it protects. */
export interface PasswordContext {
  login?: string;
  name?: string;
}

function hasRepeatedRun(value: string): boolean {
  return /(.)\1{2,}/.test(value); // aaa, 111, ...
}

function hasSequence(value: string): boolean {
  const lower = value.toLowerCase();
  const sequences = "abcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i + 3 <= sequences.length; i++) {
    const run = sequences.slice(i, i + 4);
    if (lower.includes(run) || lower.includes([...run].reverse().join(""))) return true;
  }
  return false;
}

function echoesAccount(value: string, context?: PasswordContext): boolean {
  const lower = value.toLowerCase();
  const candidates = [context?.login, context?.name]
    .filter((v): v is string => !!v && v.length >= 3)
    .flatMap((v) => [v.toLowerCase(), v.toLowerCase().split("@")[0]]);

  return candidates.some((c) => c.length >= 3 && lower.includes(c));
}

export function assessPassword(password: string, context?: PasswordContext): PasswordAssessment {
  const checks: PasswordCheck[] = [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      ok: password.length >= PASSWORD_MIN_LENGTH,
    },
    { id: "lower", label: "A lowercase letter", ok: /[a-z]/.test(password) },
    { id: "upper", label: "An uppercase letter", ok: /[A-Z]/.test(password) },
    { id: "number", label: "A number", ok: /[0-9]/.test(password) },
    {
      id: "symbol",
      label: "A symbol (!, ?, #, …)",
      ok: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const required = checks.filter((c) => c.id !== "symbol");
  const satisfied = checks.filter((c) => c.ok).length;

  let error: string | null = null;

  if (!password) {
    error = "Enter a password.";
  } else if (!required.every((c) => c.ok)) {
    const missing = required.filter((c) => !c.ok).map((c) => c.label.toLowerCase());
    error = `Password needs ${missing.join(", ")}.`;
  } else if (WEAK_PATTERNS.some((w) => password.toLowerCase().includes(w))) {
    error = "That password contains a word attackers guess first. Pick something less predictable.";
  } else if (echoesAccount(password, context)) {
    error = "The password cannot contain the VideoHub ID or name it protects.";
  } else if (hasSequence(password)) {
    error = "Avoid runs like \"abcd\" or \"1234\".";
  } else if (hasRepeatedRun(password)) {
    error = "Avoid repeating the same character three or more times.";
  }

  // Strength meter: satisfied rules, with a bonus for genuinely long passwords.
  let score = satisfied;
  if (password.length >= 16) score += 1;
  if (error) score = Math.min(score, 1);
  score = Math.max(0, Math.min(4, score - 1));

  const labels: PasswordAssessment["label"][] = [
    "Too weak",
    "Weak",
    "Fair",
    "Strong",
    "Very strong",
  ];

  return { checks, score, label: labels[score], error };
}

/** Server-side gate. Returns an error message, or null when the password is allowed. */
export function validatePassword(password: string, context?: PasswordContext): string | null {
  return assessPassword(password, context).error;
}

const GEN_LOWER = "abcdefghijkmnopqrstuvwxyz"; // no l
const GEN_UPPER = "ABCDEFGHJKLMNPQRSTUVWXYZ"; // no I, O
const GEN_NUMBER = "23456789"; // no 0, 1
const GEN_SYMBOL = "!#$%&*?@";

function randomInt(max: number): number {
  if (typeof globalThis.crypto?.getRandomValues === "function") {
    const buf = new Uint32Array(1);
    globalThis.crypto.getRandomValues(buf);
    return buf[0] % max;
  }
  return Math.floor(Math.random() * max);
}

/**
 * Builds a password that always satisfies the rules above. Ambiguous glyphs
 * (l/I/1, O/0) are left out so it survives being read aloud or retyped.
 */
export function generatePassword(length = 16): string {
  const pools = [GEN_LOWER, GEN_UPPER, GEN_NUMBER, GEN_SYMBOL];
  const all = pools.join("");

  // Guarantee one of each required class, then fill the rest.
  const chars = pools.map((pool) => pool[randomInt(pool.length)]);
  while (chars.length < length) chars.push(all[randomInt(all.length)]);

  // Fisher-Yates, so the guaranteed characters aren't always in front.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  const candidate = chars.join("");
  // Vanishingly rare, but a shuffle can still produce "abcd"-style runs.
  return assessPassword(candidate).error ? generatePassword(length) : candidate;
}
