import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export default async function RootPage() {
  const session = await getSession();
  if (session?.role === "admin") redirect("/admin");
  if (session?.role === "client") redirect("/portal");
  redirect("/login");
}
