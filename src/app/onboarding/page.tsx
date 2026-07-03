import { AppContainer, Section } from "@/components/layout";
import OnboardingForm from "@/features/onboarding/OnboardingForm";

export default function OnboardingPage() {
  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <OnboardingForm />
      </Section>
    </AppContainer>
  );
}
