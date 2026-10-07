import { VerseOfTheDay } from "@/components/VerseOfTheDay";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { YouVersionProvider } from "@youversion/platform-react-hooks";
import { HAS_YOUVERSION_APP_KEY, YOUVERSION_APP_KEY } from "@/lib/youversion";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { SiteFooter } from "@/components/SiteFooter";
import { applyLanguage, savedLanguage, updateDocumentLang } from "@/lib/i18n";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";

function NotFoundComponent() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">{t("404")}</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">{t("Page not found")}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("The page you're looking for doesn't exist or has been moved.")}
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Go home")}
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: unknown; reset: () => void }) {
  const { t } = useTranslation();
  console.error(error);
  const router = useRouter();
  const isModuleLoadError = /importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module|unable to preload/i.test(
    error instanceof Error ? error.message : String(error),
  );
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  useEffect(() => {
    if (!isModuleLoadError) return;
    const retryKey = `module-retry:${window.location.pathname}`;
    const lastRetry = Number(sessionStorage.getItem(retryKey) || 0);
    if (Date.now() - lastRetry < 30_000) return;
    sessionStorage.setItem(retryKey, String(Date.now()));
    // A rejected dynamic import stays cached by the browser; router.invalidate()
    // cannot retry it. A fresh document fetches the current page bundle.
    window.location.reload();
  }, [isModuleLoadError]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          {t("This page didn't load")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {t("Something went wrong on our end. You can try refreshing or head back home.")}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              if (isModuleLoadError) {
                window.location.reload();
                return;
              }
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            {t("Try again")}
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            {t("Go home")}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1, viewport-fit=cover",
      },
      { name: "theme-color", content: "#111018" },
      { name: "color-scheme", content: "dark" },
      { title: "City Ministers" },
      {
        name: "description",
        content:
          "City Ministers maps local ministries — coffee chats, ride shares, free clothes — so neighbors can share their gifts.",
      },
      { name: "author", content: "City Ministers" },
      { property: "og:title", content: "City Ministers" },
      {
        property: "og:description",
        content:
          "City Ministers maps local ministries so neighbors can share their gifts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Fraunces:opsz,wght@9..144,500;9..144,600&family=Karla:wght@400;500;600&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script
          // Recover from stale/failed module loads that happen before React's
          // error boundary can mount (one reload per path per 30s).
          dangerouslySetInnerHTML={{
            __html: `(function(){var re=/importing a module script failed|failed to fetch dynamically imported module|error loading dynamically imported module|unable to preload/i;function retry(){try{var k='module-retry:'+location.pathname;var l=Number(sessionStorage.getItem(k)||0);if(Date.now()-l<30000)return false;sessionStorage.setItem(k,String(Date.now()));location.reload();return true;}catch(e){return false;}}window.addEventListener('vite:preloadError',function(){retry();});window.addEventListener('unhandledrejection',function(e){var m=e&&e.reason&&(e.reason.message||String(e.reason));if(m&&re.test(m))retry();});window.addEventListener('error',function(e){if(e&&e.message&&re.test(e.message))retry();});})();`,
          }}
        />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  // Apply the visitor's saved language after hydration so SSR and the first
  // client render always match (English), then switch once the bundle loads.
  useEffect(() => {
    const lang = savedLanguage();
    if (lang !== "en") {
      void applyLanguage(lang);
    } else {
      updateDocumentLang("en");
    }
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      {HAS_YOUVERSION_APP_KEY ? (
        <YouVersionProvider appKey={YOUVERSION_APP_KEY} theme="dark">
          <VerseOfTheDay />
          <Outlet />
          <SiteFooter />
        </YouVersionProvider>
      ) : (
        <>
          <VerseOfTheDay />
          <Outlet />
          <SiteFooter />
        </>
      )}
    </QueryClientProvider>
  );
}
