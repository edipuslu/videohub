"use client";

import { useState } from "react";

/**
 * Shows a stored client password, hidden until asked for.
 *
 * `value` is null when nothing readable is stored — either the password was set
 * before this feature existed, or the server secret was rotated. Either way the
 * fix is the same: set a new password.
 */
export function SecretCell({ value }: { value: string | null }) {
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; revealing the text is the fallback.
      setReveal(true);
    }
  }

  if (!value) {
    return (
      <span
        className="text-xs font-bold text-black/30"
        title="Passwords set before this feature existed are stored one-way and cannot be read back. Use Edit to set a new one and it will show here from then on."
      >
        Hidden — set a new password to see it
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`font-mono text-xs font-black ${reveal ? "select-all text-black" : "text-black/35"}`}
      >
        {reveal ? value : "••••••••••"}
      </span>
      <button
        type="button"
        onClick={() => setReveal((v) => !v)}
        className="text-[10px] font-black uppercase tracking-wide text-black/35 hover:text-vh-bright"
      >
        {reveal ? "Hide" : "Show"}
      </button>
      <button
        type="button"
        onClick={copy}
        className="text-[10px] font-black uppercase tracking-wide text-vh-bright hover:underline"
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
