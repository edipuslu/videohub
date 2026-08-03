export type PostType = "1 post" | "mega post";

export interface Company {
  slug: string;
  name: string;
  description: string;
  login: string;
  password: string | null; // legacy plaintext, migrated to password_hash on login
  password_hash: string | null;
  projects: number;
  color: string | null;
  color_name: string | null;
  branches: string[];
  created_at: string;
}

export interface CompanyWithStats extends Company {
  video_count: number;
}

export interface VideoDelivery {
  id: number;
  company_slug: string;
  branch_name: string;
  video_date: string; // ISO date, e.g. 2026-07-14
  drive_link: string;
  duration_seconds: number;
  post_type: PostType;
  created_at: string;
}

export type CompanyUserRole = "owner" | "worker";

/** A person at a client company with their own VideoHub login. */
export interface CompanyUser {
  id: number;
  company_slug: string;
  name: string | null;
  login: string;
  role: CompanyUserRole;
  created_at: string;
}

export interface SessionPayload {
  role: "admin" | "client";
  loginId: string;
  // present for clients
  companySlug?: string;
  companyName?: string;
  /** Display name + role when signed in as a named company user (not the shared company login). */
  userName?: string;
  userRole?: CompanyUserRole;
}
