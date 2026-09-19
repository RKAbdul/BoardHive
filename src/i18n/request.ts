import { cookies } from "next/headers"
import { getRequestConfig } from "next-intl/server"
import { hasLocale } from "next-intl"
import { routing } from "./routing"

export default getRequestConfig(async ({ locale }) => {
  if (!locale) {
    // No route-derived locale — we're in a context like a Server Action,
    // where next/root-params isn't supported. Fall back to the NEXT_LOCALE
    // cookie next-intl's own middleware already sets.
    const cookieLocale = (await cookies()).get("NEXT_LOCALE")?.value
    locale = hasLocale(routing.locales, cookieLocale)
      ? cookieLocale
      : routing.defaultLocale
  }

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  }
})
