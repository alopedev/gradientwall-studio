import { ArrowRight, Check, LoaderCircle } from "lucide-react";
import { type FormEvent, type ReactNode, useId, useState } from "react";
import {
  CONSENT_TEXT,
  isNewsletterEnabled,
  type SubscribeResult,
  type SubscribeSource,
  subscribeEmail,
} from "@/lib/newsletter/subscribe";
import { track } from "@/lib/analytics";
import { PRIVACY_PAGE } from "@/lib/seo/pages";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

const ERRORS: Record<Extract<SubscribeResult, { kind: "error" }>["reason"], string> = {
  invalid_email: "That email doesn't look right. Check it and try again.",
  rate_limited: "Too many tries from your network. Wait a minute and try again.",
  failed: "Couldn't sign you up right now. Try again in a moment.",
};

interface Props {
  /** Where the form sits; stored on the contact to learn which spot works. */
  source: SubscribeSource;
  heading: ReactNode;
  /** One line under the heading: what the email is for. */
  lead?: string;
  /** `lg` for the footer, where the form is the section's headline. */
  size?: "md" | "lg";
  className?: string;
}

/**
 * One field on a single underline with an arrow, no account. Never blocks anything: it sits beside the free
 * download, not in front of it, and the line under the field says what the
 * address is for. Renders nothing until the newsletter is switched on.
 */
export function EmailCapture({ source, heading, lead, size = "md", className }: Props) {
  const id = useId();
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState(""); // honeypot: people never see it
  const [state, setState] = useState<State>({ kind: "idle" });

  if (!isNewsletterEnabled()) return null;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (state.kind === "submitting") return;
    setState({ kind: "submitting" });
    const result = await subscribeEmail({ email, source, website });
    if (result.kind === "ok") track("email-signup", { source });
    setState(
      result.kind === "ok" ? { kind: "done" } : { kind: "error", message: ERRORS[result.reason] },
    );
  };

  const submitting = state.kind === "submitting";

  return (
    <div className={className}>
      <p
        id={`${id}-h`}
        className={
          size === "lg"
            ? "display-head text-[clamp(28px,3vw,40px)] text-ink [text-wrap:balance]"
            : "m-0 font-sans text-[15px] font-medium text-ink"
        }
      >
        {heading}
      </p>
      {lead && <p className="m-0 mt-2 font-sans text-[14px] text-ink-dim">{lead}</p>}
      {state.kind === "done" ? (
        <p
          role="status"
          className="m-0 mt-5 inline-flex items-center gap-2 font-sans text-[14px] text-ink/80"
        >
          <Check className="size-[18px] text-good" strokeWidth={2.4} aria-hidden />
          You're on the list. Thanks!
        </p>
      ) : (
        <form onSubmit={onSubmit} aria-labelledby={`${id}-h`} className="mt-4">
          <div className="flex max-w-[440px] items-center border-b border-ink/25 transition-colors duration-150 focus-within:border-primary">
            <label htmlFor={`${id}-email`} className="sr-only">
              Email address
            </label>
            <input
              id={`${id}-email`}
              type="email"
              required
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-describedby={`${id}-note`}
              aria-invalid={state.kind === "error" || undefined}
              className="min-h-12 min-w-0 flex-1 bg-transparent font-sans text-[16px] text-ink outline-none placeholder:text-ink-dim"
            />
            {/* Honeypot: off-screen, skipped by keyboard and screen readers. */}
            <input
              type="text"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              className="absolute -left-[9999px] size-px opacity-0"
            />
            <button
              type="submit"
              disabled={submitting}
              aria-label={submitting ? "Sending…" : "Keep me posted"}
              className="grid size-12 shrink-0 cursor-pointer place-items-center rounded-full text-ink transition-colors duration-150 hover:bg-ink/10 focus-ring disabled:cursor-default disabled:opacity-60"
            >
              {submitting ? (
                <LoaderCircle className="size-5 animate-spin" aria-hidden />
              ) : (
                <ArrowRight className="size-5" aria-hidden />
              )}
            </button>
          </div>
          <p id={`${id}-note`} className="m-0 mt-2.5 font-sans text-[12px] text-ink-dim">
            {CONSENT_TEXT}{" "}
            <a href={PRIVACY_PAGE.path} className="underline underline-offset-2 hover:text-ink">
              Privacy
            </a>
          </p>
          {state.kind === "error" && (
            <p role="alert" className="m-0 mt-2 font-sans text-[13px] text-red-300">
              {state.message}
            </p>
          )}
        </form>
      )}
    </div>
  );
}
