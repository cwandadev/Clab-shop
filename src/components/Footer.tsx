import { Link } from "@tanstack/react-router";
import { Logo } from "./Logo";

// Google Translate widget — supports auto-detect and a chosen set of languages.
// The widget bootstraps from the <Scripts> include in __root.tsx.
const LANGS = [
  { code: "en", label: "English" },
  { code: "rw", label: "Kinyarwanda" },
  { code: "fr", label: "Français" },
  { code: "ru", label: "Русский" },
  { code: "sw", label: "Kiswahili" },
  { code: "ja", label: "日本語" },
  { code: "zh-CN", label: "中文" },
  { code: "ko", label: "한국어" },
  { code: "es", label: "Español" },
  { code: "ar", label: "العربية" },
];

function setGoogleLang(code: string) {
  // Google Translate stores selection in a cookie called googtrans
  const value = `/auto/${code}`;
  document.cookie = `googtrans=${value};path=/`;
  document.cookie = `googtrans=${value};path=/;domain=${location.hostname}`;
  location.reload();
}

export function Footer() {
  return (
    <footer className="mt-24 border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-3">
              <Logo className="size-9" />
              <div className="leading-tight">
                <p className="font-mono text-base font-bold">tieflab</p>
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  From Clab — Hardware Innovation Lab
                </p>
              </div>
            </div>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              tieflab is a hardware and software company. Clab is our hardware innovation and
              product-launch branch, designing creative DIY electronics for makers and engineers
              worldwide.
            </p>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Shop
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/" className="hover:text-accent">
                  All products
                </Link>
              </li>
              <li>
                <Link to="/cart" className="hover:text-accent">
                  Cart
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-accent">
                  Sign in
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
              Language
            </h4>
            <select
              defaultValue=""
              onChange={(e) => e.target.value && setGoogleLang(e.target.value)}
              className="mt-4 w-full rounded-md border border-input bg-background px-2 py-1.5 text-sm"
            >
              <option value="" disabled>
                Choose language…
              </option>
              {LANGS.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
            <p className="mt-2 text-[10px] text-muted-foreground">
              Powered by Google Translate · auto-detected by location
            </p>
            {/* hidden mount point for the Google widget */}
            <div id="google_translate_element" className="hidden" />
          </div>
        </div>

        <div className="mt-10 flex flex-col-reverse sm:flex-row items-start sm:items-center justify-between gap-4 border-t border-border pt-6">
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            © {new Date().getFullYear()} tieflab · Clab · Kigali, Rwanda
          </p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            Payments: Stripe · MoMo · Bank Transfer · Cash
          </p>
        </div>
      </div>
    </footer>
  );
}
