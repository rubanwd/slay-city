import { AdminToastProvider } from "@/features/admin/AdminToast";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminToastProvider>{children}</AdminToastProvider>;
}
