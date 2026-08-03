"use client";

import { useEffect, useState } from "react";

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Delete",
  confirmWord,
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  /** If set, the confirm button stays disabled until the user types this word exactly (e.g. "DELETE"). */
  confirmWord?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  const [typed, setTyped] = useState("");

  useEffect(() => {
    if (open) setTyped("");
  }, [open]);

  if (!open) return null;

  const locked = !!confirmWord && typed !== confirmWord;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-vh-deep/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[1.5rem] border-2 border-vh-line bg-white p-7 shadow-2xl">
        <h3 className="text-xl font-black uppercase leading-tight tracking-tight text-black">{title}</h3>
        <p className="mt-2.5 text-sm font-bold text-black/45">{description}</p>

        {confirmWord && (
          <div className="mt-5">
            <label className="vh-label">
              Type <span className="text-red-600">{confirmWord}</span> to confirm
            </label>
            <input
              className="vh-input"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={confirmWord}
              autoFocus
              autoComplete="off"
            />
          </div>
        )}

        <div className="mt-7 flex justify-end gap-3">
          <button className="vh-btn-secondary" onClick={onCancel} disabled={loading}>
            Cancel
          </button>
          <button
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-5 py-2.5 text-sm font-black text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
            onClick={onConfirm}
            disabled={loading || locked}
          >
            {loading ? "Deleting…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
