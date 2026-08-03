"use client";

/**
 * fetch wrapper for signed-in pages.
 *
 * Sessions expire after 12 hours. Without this, an expired session shows up as
 * a raw "Admin authentication required." error on whatever button was clicked;
 * instead we send the person back to the login screen.
 */
export async function apiFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, init);

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.href = "/login";
  }

  return res;
}
