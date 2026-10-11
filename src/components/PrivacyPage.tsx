import type { ReactNode } from "react";
import { Footer } from "./Footer";
import { Nav } from "./Nav";
import { PageMeta } from "./PageMeta";
import { PRIVACY_PAGE } from "@/lib/seo/pages";

const OWNER = "Àlex Olivé Pérez";
const EMAIL = "alexoliveperez@gmail.com";

function Mail() {
  return (
    <a href={`mailto:${EMAIL}`} className="underline underline-offset-2 hover:text-white">
      {EMAIL}
    </a>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-10">
      <h2 className="m-0 mb-3 font-sans text-[18px] font-semibold text-white">{title}</h2>
      <div className="flex flex-col gap-3 font-sans text-[15px] font-light leading-relaxed text-white/75">
        {children}
      </div>
    </section>
  );
}

/** Privacy notice: the email list, purchases and who processes the data. */
export function PrivacyPage() {
  return (
    <>
      <PageMeta
        title={PRIVACY_PAGE.title}
        description={PRIVACY_PAGE.description}
        path={PRIVACY_PAGE.path}
      />
      <Nav />
      <main className="min-h-screen pt-[120px] pb-[clamp(60px,9vw,120px)]">
        <article className="mx-auto max-w-[680px] px-[clamp(24px,5vw,80px)]">
          <h1 className="display-head m-0 text-[clamp(36px,4.6vw,56px)] leading-[1.05] text-white">
            Privacy
          </h1>
          <p className="mt-4 font-sans text-[15px] font-light leading-relaxed text-white/75">
            The short version: the Studio works without an account and does not ask for your data.
            We only keep your email if you join the list or buy a pack.
          </p>

          <Section title="Who is responsible">
            <p>
              {OWNER}, running GradientWall from Tarragona (Spain). Contact: <Mail />.
            </p>
          </Section>

          <Section title="The email list">
            <p>
              <strong className="font-medium text-white">What we keep:</strong> your email, the spot
              of the site where you signed up (Studio or footer), the wording you saw next to the
              button, and the date.
            </p>
            <p>
              <strong className="font-medium text-white">Why:</strong> to tell you about new packs
              and Studio features, now and then.
            </p>
            <p>
              <strong className="font-medium text-white">Legal basis:</strong> your consent. You
              give it by submitting the form.
            </p>
            <p>
              <strong className="font-medium text-white">How long:</strong> until you unsubscribe.
              Write to <Mail /> and we remove you.
            </p>
          </Section>

          <Section title="Purchases">
            <p>
              Packs are sold through Lemon Squeezy, which takes the payment and issues the receipt.
              We receive your email and the order, and keep them to send your download link and let
              you recover it. Legal basis: the contract of sale. Orders are kept while the download
              link is valid and as long as accounting rules require.
            </p>
          </Section>

          <Section title="Who handles your data for us">
            <p>
              Supabase (database, in the EU) stores the email list and the orders. Netlify hosts the
              site and runs the functions that receive the form. Lemon Squeezy handles payments. A
              transactional email service sends your download link. We do not sell your data and do
              not use it for advertising.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              You can ask for access to your data, rectification, erasure, restriction or
              portability, and you can object or withdraw your consent at any time, by writing to{" "}
              <Mail />. Withdrawing does not affect what we did before.
            </p>
            <p>
              If you think we handle your data wrongly, you can complain to the Spanish data
              protection authority:{" "}
              <a
                href="https://www.aepd.es"
                className="underline underline-offset-2 hover:text-white"
                rel="noopener noreferrer"
              >
                aepd.es
              </a>
              .
            </p>
          </Section>

          <Section title="On your device">
            <p>
              The Studio saves your favourites in your browser's local storage. They never leave
              your device.
            </p>
          </Section>
        </article>
      </main>
      <Footer />
    </>
  );
}
