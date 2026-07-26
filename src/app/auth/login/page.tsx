import { AppContainer, Section } from "@/components/layout";
import AuthBackdrop from "@/features/auth/AuthBackdrop";
import AuthForm from "@/features/auth/AuthForm";
import { loginFormAction } from "@/features/auth/actions";
import DemoGateNotice from "@/features/demo/DemoGateNotice";
import { resolveBrowserLocale } from "@/features/i18n/server";

interface LoginPageProps {
  /** `from=demo` means the visitor got here by finishing the free demo location. */
  searchParams: Promise<{ message?: string; error?: string; from?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { message, error, from } = await searchParams;
  const fromDemo = from === "demo";
  const locale = await resolveBrowserLocale();

  return (
    <AppContainer className="relative justify-center">
      <AuthBackdrop />
      <Section py="none" className="relative z-10 items-center">
        {fromDemo && <DemoGateNotice locale={locale} />}
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
