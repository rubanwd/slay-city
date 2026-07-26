import { AppContainer, Section } from "@/components/layout";
import { BackLink } from "@/components/ui";
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

        {/*
          A way back for someone who only came to look. Left out after the demo:
          that visitor already has a Back button above, which also resets their
          demo run — the browser's own back would only bounce them here again.
        */}
        {!fromDemo && <BackLink className="mt-6" />}
      </Section>
    </AppContainer>
  );
}
