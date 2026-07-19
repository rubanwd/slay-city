import { AppContainer, Section } from "@/components/layout";
import AuthBackdrop from "@/features/auth/AuthBackdrop";
import AuthForm from "@/features/auth/AuthForm";
import { loginFormAction } from "@/features/auth/actions";

interface LoginPageProps {
  searchParams: Promise<{ message?: string; error?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, error } = await searchParams;

  return (
    <AppContainer className="relative justify-center">
      <AuthBackdrop />
      <Section py="none" className="relative z-10 items-center">
        <AuthForm
          mode="login"
          action={loginFormAction}
          initialMessage={message}
          initialError={error}
        />
      </Section>
    </AppContainer>
  );
}
