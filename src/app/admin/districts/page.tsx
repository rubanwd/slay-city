import { redirect } from "next/navigation";

/**
 * Districts now live under a knowledge level (`/admin/levels/<level>`), so the
 * flat district list is gone. Kept as a redirect because it was the entry point
 * bookmarked from the Content Manager landing and the sidebar.
 */
export default function AdminDistrictsPage() {
  redirect("/admin/levels");
}
