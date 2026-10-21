import { PassThrough } from "node:stream";
import { renderToPipeableStream } from "react-dom/server";
import { StaticRouter } from "react-router";
import { AppContent, AppFrame } from "./App";
import { useConfigStore } from "./store";
import { startLookFor } from "./store/page-start";

/** Each page starts from the same look, whatever the page before it set. */
const INITIAL = useConfigStore.getState();

/** The page at `url` as HTML, once every lazy route has loaded. */
export function render(url: string): Promise<string> {
  useConfigStore.setState(INITIAL, true);
  startLookFor(url);
  return new Promise((resolve, reject) => {
    let html = "";
    const sink = new PassThrough();
    sink.on("data", (chunk) => {
      html += chunk;
    });
    sink.on("end", () => resolve(html));
    const stream = renderToPipeableStream(
      <AppFrame>
        <StaticRouter location={url}>
          <AppContent />
        </StaticRouter>
      </AppFrame>,
      {
        onAllReady: () => stream.pipe(sink),
        onShellError: reject,
        onError: reject,
      },
    );
  });
}
