import AdminAddAdminForm from "@/features/admin/AdminAddAdminForm";
import AdminCreateModal from "@/features/admin/AdminCreateModal";
import AdminHeader from "@/features/admin/AdminHeader";
import { removeAdminEmail } from "@/features/admin/actions";
import { requireAdminPage } from "@/features/admin/guard";

/**
 * Manage the admin allow-list: add or remove emails without touching SQL.
 * Anyone on the list becomes an admin on their next login (see `claim_admin`).
 */
export default async function ManageAdminsPage() {
  const { supabase } = await requireAdminPage();

  const { data: admins } = await supabase
    .from("admin_emails")
    .select("email, created_at")
    .order("created_at", { ascending: false });

  const rows = admins ?? [];

  return (
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto flex w-full max-w-md flex-col px-5 pb-16">
        <AdminHeader title="Manage Admins" backHref="/admin" />

        <div className="mb-6">
          <AdminCreateModal triggerLabel="Add Admin" title="Add Admin">
            <AdminAddAdminForm />
          </AdminCreateModal>
        </div>

        <h2 className="mb-2 text-label text-white/50">Allow-listed ({rows.length})</h2>
        {rows.length === 0 ? (
          <p className="rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-6 text-center text-small text-white/50">
            No admins on the list yet.
          </p>
        ) : (
          <ul className="flex flex-col gap-2">
            {rows.map((row) => (
              <li
                key={row.email}
                className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#1a1a1a] px-4 py-3"
              >
                <span className="truncate text-body-strong text-white">{row.email}</span>
                <form action={removeAdminEmail} className="shrink-0">
                  <input type="hidden" name="email" value={row.email} />
                  <button
                    type="submit"
                    className="rounded-full border border-neon-pink/40 px-3 py-1.5 text-xs font-bold uppercase tracking-wide text-neon-pink transition-colors hover:bg-neon-pink/10"
                  >
                    Remove
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
