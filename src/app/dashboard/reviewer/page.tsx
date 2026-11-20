import { redirect } from "next/navigation";
import { requirePageAuth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function ReviewerDashboardPage() {
  await requirePageAuth(undefined, "/dashboard/user?tab=reviewer");
  redirect("/dashboard/user?tab=reviewer");
}
