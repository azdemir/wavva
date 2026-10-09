import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

/**
 * Scoped i18n provider for the app (dashboard + onboarding). The marketing
 * site stays static English, so the provider lives here instead of the root
 * layout — the dashboard is already fully dynamic.
 */
export async function DashboardIntlProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [locale, messages] = await Promise.all([getLocale(), getMessages()]);
  return (
    <NextIntlClientProvider messages={messages}>
      <div lang={locale} className="contents">
        {children}
      </div>
    </NextIntlClientProvider>
  );
}
