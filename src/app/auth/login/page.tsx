import { AppContainer, Section } from "@/components/layout";
import AuthForm from "@/features/auth/AuthForm";
import { loginFormAction } from "@/features/auth/actions";

export default function LoginPage() {
  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <AuthForm mode="login" action={loginFormAction} />
      </Section>
    </AppContainer>
  );
}
