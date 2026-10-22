// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PageLink } from "./PageLink";

type Doc = { startViewTransition?: unknown };

function fakeViewTransitions() {
  const start = vi.fn((update: () => Promise<void> | void) => {
    const updateCallbackDone = Promise.resolve().then(update);
    return { updateCallbackDone, finished: updateCallbackDone };
  });
  (document as unknown as Doc).startViewTransition = start;
  return start;
}

afterEach(() => {
  delete (document as unknown as Doc).startViewTransition;
});

function App() {
  return (
    <MemoryRouter initialEntries={["/"]}>
      <Routes>
        <Route
          path="/"
          element={
            <>
              <h1>home</h1>
              <PageLink to="/privacy/">Privacy</PageLink>
              <PageLink to="/">Home</PageLink>
            </>
          }
        />
        <Route path="/privacy" element={<h1>privacy</h1>} />
      </Routes>
    </MemoryRouter>
  );
}

describe("PageLink", () => {
  it("opens the page inside a view transition", async () => {
    const start = fakeViewTransitions();
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Privacy" }));
    expect(start).toHaveBeenCalledOnce();
    expect(await screen.findByRole("heading", { name: "privacy" })).toBeInTheDocument();
  });

  it("just navigates where view transitions are missing", async () => {
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Privacy" }));
    expect(await screen.findByRole("heading", { name: "privacy" })).toBeInTheDocument();
  });

  it("glides back to the top instead of reopening the page it is on", () => {
    const start = fakeViewTransitions();
    const scrollTo = vi.fn();
    window.scrollTo = scrollTo as unknown as typeof window.scrollTo;
    render(<App />);
    fireEvent.click(screen.getByRole("link", { name: "Home" }));
    expect(start).not.toHaveBeenCalled();
    expect(scrollTo).toHaveBeenCalledWith({ top: 0, behavior: "smooth" });
    expect(screen.getByRole("heading", { name: "home" })).toBeInTheDocument();
  });
});
