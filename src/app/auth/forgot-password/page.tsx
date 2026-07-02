import { AppContainer, Section } from "@/components/layout";
import ForgotPasswordForm from "@/features/auth/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <ForgotPasswordForm />
      </Section>
    </AppContainer>
  );
}
