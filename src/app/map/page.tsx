import AuthGuard from "@/components/auth/AuthGuard";
import CityMap from "@/components/map/CityMap";

export default function MapPage() {
  return (
    <AuthGuard>
      <CityMap />
    </AuthGuard>
  );
}
