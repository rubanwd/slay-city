import AuthGuard from "@/components/auth/AuthGuard";
import WardrobeGrid from "@/components/wardrobe/WardrobeGrid";

export default function WardrobePage() {
  return (
    <AuthGuard>
      <WardrobeGrid />
    </AuthGuard>
  );
}
