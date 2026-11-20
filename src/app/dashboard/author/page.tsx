import { redirect } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AuthorDashboardPage() {
  await requirePageAuth(undefined, "/dashboard/user?tab=author");
  redirect("/dashboard/user?tab=author");
}
