import { AppContainer, Section } from "@/components/layout";
import AuthForm from "@/features/auth/AuthForm";
import { loginFormAction } from "@/features/auth/actions";

interface LoginPageProps {
  searchParams: Promise<{ message?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message } = await searchParams;

  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <AuthForm mode="login" action={loginFormAction} initialMessage={message} />
      </Section>
    </AppContainer>
  );
}
