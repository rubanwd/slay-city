import { AppContainer, Section } from "@/components/layout";
import AuthBackdrop from "@/features/auth/AuthBackdrop";
import AuthForm from "@/features/auth/AuthForm";
import { registerFormAction } from "@/features/auth/actions";

export default function RegisterPage() {
  return (
    <AppContainer className="relative justify-center">
      <AuthBackdrop />
      <Section py="none" className="relative z-10 items-center">
        <AuthForm mode="register" action={registerFormAction} />
      </Section>
    </AppContainer>
  );
}
