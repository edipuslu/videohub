"use client";

import { useMemo, useState } from "react";
import { assessPassword, generatePassword, type PasswordContext } from "@/lib/passwordPolicy";

const METER_COLORS = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-vh-lime", "bg-vh-bright"];

export interface PasswordFieldsProps {
  password: string;
  confirm: string;
  onPasswordChange: (value: string) => void;
  onConfirmChange: (value: string) => void;
  /** Used to reject passwords that echo the account they protect. */
  context?: PasswordContext;
  /** When true the fields may be left blank (editing keeps the existing password). */
  optional?: boolean;
  label?: string;
  idPrefix?: string;
}

/**
 * Password + confirmation with live strength feedback.
 *
 * Both fields are always shown: typing a password once is how typos become
 * lockouts. Callers gate submit on `isPasswordPairValid`.
 */
export function PasswordFields({
  password,
  confirm,
  onPasswordChange,
  onConfirmChange,
  context,
  optional = false,
  label = "Password",
  idPrefix = "pw",
}: PasswordFieldsProps) {
  const [reveal, setReveal] = useState(false);
  const [generated, setGenerated] = useState<string | null>(null);

  const assessment = useMemo(() => assessPassword(password, context), [password, context]);
  const skipped = optional && !password && !confirm;
  const mismatch = !skipped && confirm.length > 0 && password !== confirm;

  function handleGenerate() {
    const next = generatePassword();
    onPasswordChange(next);
    onConfirmChange(next);
    setGenerated(next);
    setReveal(true);
  }

  return (
    <div className="space-y-3">
      <div>
        <div className="flex items-center justify-between">
          <label className="vh-label" htmlFor={`${idPrefix}-password`}>
            {label}
            {optional && <span className="ml-1 normal-case text-black/30">(leave blank to keep current)</span>}
          </label>
          <button
            type="button"
            onClick={handleGenerate}
            className="mb-1.5 text-[11px] font-black uppercase tracking-wide text-vh-bright hover:underline"
          >
            Suggest strong
          </button>
        </div>

        <div className="relative">
          <input
            id={`${idPrefix}-password`}
            type={reveal ? "text" : "password"}
            className="vh-input pr-16"
            value={password}
            onChange={(e) => {
              onPasswordChange(e.target.value);
              setGenerated(null);
            }}
            autoComplete="new-password"
            placeholder="••••••••"
            required={!optional}
          />
          <button
            type="button"
            onClick={() => setReveal((v) => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-black uppercase tracking-wide text-black/40 hover:text-vh-bright"
          >
            {reveal ? "Hide" : "Show"}
          </button>
        </div>
      </div>

      {!skipped && password.length > 0 && (
        <>
          <div>
            <div className="flex h-1.5 gap-1 overflow-hidden rounded-full">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-full flex-1 rounded-full transition-colors ${
                    i <= assessment.score ? METER_COLORS[assessment.score] : "bg-vh-line"
                  }`}
                />
              ))}
            </div>
            <p className="mt-1.5 text-[11px] font-black uppercase tracking-wide text-black/45">
              Strength: {assessment.label}
            </p>
          </div>

          <ul className="grid grid-cols-1 gap-1 sm:grid-cols-2">
            {assessment.checks.map((c) => (
              <li
                key={c.id}
                className={`flex items-center gap-1.5 text-[11px] font-bold ${
                  c.ok ? "text-vh-bright" : "text-black/35"
                }`}
              >
                <span
                  className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full text-[8px] ${
                    c.ok ? "bg-vh-bright text-white" : "bg-vh-line text-transparent"
                  }`}
                >
                  ✓
                </span>
                {c.label}
              </li>
            ))}
          </ul>

          {assessment.error && (
            <p className="text-[11px] font-bold text-red-600">{assessment.error}</p>
          )}
        </>
      )}

      {generated && (
        <div className="rounded-xl border-2 border-vh-lime bg-vh-lime/20 px-3 py-2">
          <p className="text-[11px] font-black uppercase tracking-wide text-black/60">
            Copy this before saving
          </p>
          <p className="select-all break-all font-mono text-sm font-black text-black">{generated}</p>
        </div>
      )}

      <div>
        <label className="vh-label" htmlFor={`${idPrefix}-confirm`}>
          Re-type {label.toLowerCase()}
        </label>
        <input
          id={`${idPrefix}-confirm`}
          type={reveal ? "text" : "password"}
          className="vh-input"
          value={confirm}
          onChange={(e) => onConfirmChange(e.target.value)}
          autoComplete="new-password"
          placeholder="••••••••"
          required={!optional}
        />
        {mismatch && (
          <p className="mt-1.5 text-[11px] font-bold text-red-600">The passwords do not match.</p>
        )}
      </div>
    </div>
  );
}

/** Whether a password/confirm pair may be submitted. */
export function isPasswordPairValid(
  password: string,
  confirm: string,
  options?: { optional?: boolean; context?: PasswordContext }
): boolean {
  if (options?.optional && !password && !confirm) return true;
  if (password !== confirm) return false;
  return assessPassword(password, options?.context).error === null;
}
