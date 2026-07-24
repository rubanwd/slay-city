import { AppContainer, Section } from "@/components/layout";
import { getAvailableLevels } from "@/features/levels/queries";
import OnboardingForm from "@/features/onboarding/OnboardingForm";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage() {
  const supabase = await createClient();
  // Only levels with playable content are offered — today that's Elementary.
  const levels = await getAvailableLevels(supabase);

  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <OnboardingForm levels={levels} />
      </Section>
    </AppContainer>
  );
}
