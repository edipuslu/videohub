import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { PortalClient } from "./PortalClient";

export default async function ClientPortalPage() {
  const session = await getSession();
  if (!session || session.role !== "client" || !session.companySlug) {
    redirect("/login");
  }

  return <PortalClient slug={session.companySlug} companyName={session.companyName ?? ""} />;
}
