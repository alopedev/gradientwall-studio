import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { Nav } from "./Nav";
import { Footer } from "./Footer";
import { inkButton } from "./ui/InkButton";
import { PageMeta } from "./PageMeta";
import { submitRecoverRequest } from "@/lib/store";

type State =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "done" }
  | { kind: "error"; message: string };

export function RecoverForm() {
  const [email, setEmail] = useState("");
  const [orderId, setOrderId] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setState({ kind: "submitting" });
    const result = await submitRecoverRequest({ email, orderId });
    if (result.kind === "ok") {
      setState({ kind: "done" });
    } else {
      setState({ kind: "error", message: result.message });
    }
  }

  return (
    <>
      <PageMeta
        title="Recover your download link"
        description="Lost your download email? Recover it with your order ID."
        path="/recover"
        noindex
      />
      <Nav />
      <main className="min-h-screen pt-[120px] pb-[clamp(60px,9vw,120px)]">
        <section className="mx-auto max-w-[560px] px-[clamp(24px,5vw,80px)]">
          <Link
            to="/#packs"
            className="inline-flex min-h-11 items-center gap-1.5 mb-2 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-dim hover:text-ink"
          >
            ← All packs
          </Link>
          <span className="block mb-4 font-sans text-[11px] tracking-[0.22em] uppercase text-ink-dim">
            Recover download
          </span>
          <h1 className="display-head text-[clamp(36px,4.6vw,56px)] text-ink leading-[1.05] mb-4">
            lost your download link?
          </h1>
          <p className="font-sans text-[15px] text-ink-dim leading-relaxed mb-8">
            Enter the email and order ID from your Lemon Squeezy receipt. If they match a real paid
            order, we'll re-send the download link to that email.
          </p>

          {state.kind === "done" ? (
            <div className="rounded-sharp border border-ink/15 bg-ink/5 p-5 font-sans text-[14px] text-ink/80 leading-relaxed">
              If the order exists, a fresh download email is on its way. Check your inbox in the
              next minute.
            </div>
          ) : (
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <label className="block">
                <span className="block mb-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-dim">
                  Email used at checkout
                </span>
                <input
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full rounded-sharp bg-bg border-2 border-ink/40 px-3 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-dim focus:border-ink focus:outline-none"
                  placeholder="you@example.com"
                />
              </label>
              <label className="block">
                <span className="block mb-1.5 font-sans text-[11px] tracking-[0.18em] uppercase text-ink-dim">
                  Order ID
                </span>
                <input
                  type="text"
                  required
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  className="block w-full rounded-sharp bg-bg border-2 border-ink/40 px-3 py-2.5 font-sans text-[14px] text-ink placeholder:text-ink-dim focus:border-ink focus:outline-none"
                  placeholder="The numeric ID from your receipt"
                />
              </label>

              {state.kind === "error" && (
                <div className="rounded-sharp border border-red-500/30 bg-red-500/10 px-3 py-2 font-sans text-[13px] text-red-200">
                  {state.message}
                </div>
              )}

              <button
                type="submit"
                disabled={state.kind === "submitting"}
                className={`${inkButton({ variant: "primary" })} mt-2 self-start px-6`}
              >
                {state.kind === "submitting" ? "Sending…" : "Send me the link"}
              </button>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
