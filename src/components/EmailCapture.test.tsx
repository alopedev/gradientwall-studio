// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CONSENT_TEXT } from "@/lib/newsletter/subscribe";
import { EmailCapture } from "./EmailCapture";

describe("EmailCapture", () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "true");
    fetchSpy = vi.spyOn(global, "fetch");
  });
  afterEach(() => {
    fetchSpy.mockRestore();
    vi.unstubAllEnvs();
  });

  it("renders nothing while the newsletter is switched off", () => {
    vi.stubEnv("VITE_NEWSLETTER_ENABLED", "");
    const { container } = render(<EmailCapture source="footer" heading="Hi" />);
    expect(container).toBeEmptyDOMElement();
  });

  it("sends the email with its source and the consent wording, then thanks the person", async () => {
    fetchSpy.mockResolvedValue(new Response('{"ok":true}', { status: 200 }));
    const user = userEvent.setup();
    render(<EmailCapture source="studio" heading="Hi" />);
    await user.type(screen.getByLabelText("Email address"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Keep me posted" }));
    expect(JSON.parse((fetchSpy.mock.calls[0][1] as RequestInit).body as string)).toEqual({
      email: "ana@example.com",
      source: "studio",
      website: "",
      consentText: CONSENT_TEXT,
    });
    expect((await screen.findByRole("status")).textContent).toMatch(/on the list/);
  });

  it("links the privacy page from the consent line", () => {
    render(<EmailCapture source="footer" heading="Hi" />);
    const link = screen.getByRole("link", { name: /privacy/i });
    expect(link.getAttribute("href")).toBe("/privacy");
  });

  it("shows the reason and keeps the form when the server refuses", async () => {
    fetchSpy.mockResolvedValue(
      new Response('{"ok":false,"reason":"invalid_email"}', { status: 400 }),
    );
    const user = userEvent.setup();
    render(<EmailCapture source="footer" heading="Hi" />);
    await user.type(screen.getByLabelText("Email address"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Keep me posted" }));
    expect((await screen.findByRole("alert")).textContent).toMatch(/doesn't look right/);
    expect(screen.getByLabelText("Email address")).toBeTruthy();
  });

  it("shows the line under the heading when one is given", () => {
    render(<EmailCapture source="footer" heading="Hi" lead="One email per pack." />);
    expect(screen.getByText("One email per pack.")).toBeTruthy();
  });

  it("marks the form busy while the address is being sent", async () => {
    let resolve: (r: Response) => void = () => {};
    fetchSpy.mockReturnValue(new Promise<Response>((r) => (resolve = r)));
    const user = userEvent.setup();
    render(<EmailCapture source="footer" heading="Hi" />);
    await user.type(screen.getByLabelText("Email address"), "ana@example.com");
    await user.click(screen.getByRole("button", { name: "Keep me posted" }));
    expect(screen.getByRole("button", { name: "Sending…" }).hasAttribute("disabled")).toBe(true);
    resolve(new Response('{"ok":true}', { status: 200 }));
    await screen.findByRole("status");
  });
});
