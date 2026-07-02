import { AppContainer, Section } from "@/components/layout";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <ResetPasswordForm />
      </Section>
    </AppContainer>
  );
}
