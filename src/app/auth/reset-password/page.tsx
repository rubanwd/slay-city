import { redirect } from "next/navigation";

import { AppContainer, Section } from "@/components/layout";
import ResetPasswordForm from "@/features/auth/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export default async function ResetPasswordPage() {
  // Reached only through the recovery link, which signs the user in first.
  // Without that session `updateUser` would fail with a cryptic "Auth session
  // missing" after the user has already typed a new password — bounce here
  // instead, so an expired or copy-pasted link says what actually went wrong.
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(
      "/auth/login?error=" +
        encodeURIComponent("That reset link has expired. Request a new one.")
    );
  }

  return (
    <AppContainer className="justify-center">
      <Section py="none" className="items-center">
        <ResetPasswordForm />
      </Section>
    </AppContainer>
  );
}
