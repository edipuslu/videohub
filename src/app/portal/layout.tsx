import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session || session.role !== "client") redirect("/login");
  return <div className="min-h-screen">{children}</div>;
}
