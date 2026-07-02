import { AppContainer, Section } from "@/components/layout";
import AuthForm from "@/features/auth/AuthForm";
import { registerFormAction } from "@/features/auth/actions";

export default function RegisterPage() {
  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <AuthForm mode="register" action={registerFormAction} />
      </Section>
    </AppContainer>
  );
}
