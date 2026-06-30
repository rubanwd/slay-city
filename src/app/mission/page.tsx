import AuthGuard from "@/components/auth/AuthGuard";
import MissionScreen from "@/components/mission/MissionScreen";

export default function MissionPage() {
  return (
    <AuthGuard>
      <MissionScreen />
    </AuthGuard>
  );
}
