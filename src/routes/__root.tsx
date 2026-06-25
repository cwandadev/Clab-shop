import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "../lib/store";
import { supabase } from "@/integrations/supabase/client";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-mono text-7xl font-bold">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Component not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This page does not exist in our archive.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Back to inventory
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight">This page didn't load</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong. Try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background"
          >
            Try again
          </button>
          <a
            href="/"
            className="rounded-md border border-input px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Go home
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
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Clab — DIY Electronics, Components & Creative Hardware" },
      {
        name: "description",
        content:
          "Clab from tieflab — Hardware Innovation. LEDs, Arduino, Raspberry Pi, soldering tools, futuristic bulbs and creative DIY electronics. Free Kigali shipping over $10.",
      },
      { property: "og:title", content: "Clab — DIY Electronics, Components & Creative Hardware" },
      {
        property: "og:description",
        content: "High-tolerance components, microcontrollers and creative lighting from Clab.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: "Clab — DIY Electronics, Components & Creative Hardware" },
      { name: "description", content: "Electro Hub is a responsive e-commerce platform for selling a wide range of electronics, from DIY components to finished equipment." },
      { property: "og:description", content: "Electro Hub is a responsive e-commerce platform for selling a wide range of electronics, from DIY components to finished equipment." },
      { name: "twitter:description", content: "Electro Hub is a responsive e-commerce platform for selling a wide range of electronics, from DIY components to finished equipment." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/66f79278-a160-43b2-80b8-10f7a6e7d4d8/id-preview-47bc2b82--b24ef528-104c-4e2b-ba29-c131488b4741.lovable.app-1782187262827.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/66f79278-a160-43b2-80b8-10f7a6e7d4d8/id-preview-47bc2b82--b24ef528-104c-4e2b-ba29-c131488b4741.lovable.app-1782187262827.png" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Instrument+Sans:ital,wght@0,400..600;1,400..600&family=JetBrains+Mono:wght@400;500&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      {
        rel: "icon",
        type: "image/png",
        href: "/__l5e/assets-v1/74429fa3-117e-4dc0-b2a1-15e713b78d31/clab.png",
      },
    ],
    scripts: [
      {
        children:
          "function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'en,rw,fr,ru,sw,ja,zh-CN,ko,es,ar',layout:google.translate.TranslateElement.InlineLayout.SIMPLE,autoDisplay:false},'google_translate_element');}",
      },
      {
        src: "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit",
        async: true,
      },
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
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function AuthSubscriber() {
  const router = useRouter();
  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN" || event === "SIGNED_OUT" || event === "USER_UPDATED") {
        router.invalidate();
      }
    });
    return () => data.subscription.unsubscribe();
  }, [router]);
  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <AuthSubscriber />
        <Outlet />
        <Toaster position="top-right" richColors />
      </StoreProvider>
    </QueryClientProvider>
  );
}
