import { Check } from "lucide-react";
import { type FormEvent, useId, useState } from "react";
import { GlassButton } from "@/components/ui/GlassButton";
import {
  CONSENT_TEXT,
  isNewsletterEnabled,
  type SubscribeResult,
  type SubscribeSource,
  subscribeEmail,
} from "@/lib/newsletter/subscribe";

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
  heading: string;
  className?: string;
}

/**
 * One field, no account. Never blocks anything: it sits beside the free
 * download, not in front of it, and the line under the field says what the
 * address is for. Renders nothing until the newsletter is switched on.
 */
export function EmailCapture({ source, heading, className }: Props) {
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
    setState(
      result.kind === "ok" ? { kind: "done" } : { kind: "error", message: ERRORS[result.reason] },
    );
  };

  return (
    <div className={className}>
      <p id={`${id}-h`} className="m-0 mb-3 font-sans text-[15px] font-medium text-white">
        {heading}
      </p>
      {state.kind === "done" ? (
        <p
          role="status"
          className="m-0 inline-flex items-center gap-2 font-sans text-[14px] text-white/80"
        >
          <Check className="size-[18px] text-good" strokeWidth={2.4} aria-hidden />
          You're on the list. Thanks!
        </p>
      ) : (
        <form onSubmit={onSubmit} aria-labelledby={`${id}-h`}>
          <div className="flex flex-wrap items-center gap-2">
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
              className="min-h-11 min-w-0 flex-1 basis-[200px] rounded-glass bg-white/5 px-4 font-sans text-[0.9rem] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.09)] outline-none placeholder:text-white/35 focus-visible:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.3)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
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
            <GlassButton type="submit" variant="primary" disabled={state.kind === "submitting"}>
              {state.kind === "submitting" ? "Sending…" : "Keep me posted"}
            </GlassButton>
          </div>
          <p id={`${id}-note`} className="m-0 mt-2.5 font-sans text-[12px] text-white/50">
            {CONSENT_TEXT}
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
