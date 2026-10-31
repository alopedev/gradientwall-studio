/**
 * A module loaded the first time something asks for it, once: `get` answers
 * synchronously once it has arrived, `load` starts it (or joins the load in
 * flight). The engine keeps its heavy parts behind these, out of the first JS.
 */
export interface Lazy<T> {
  get: () => T | undefined;
  load: () => Promise<T>;
}

export function lazy<T>(loader: () => Promise<T>): Lazy<T> {
  let value: T | undefined;
  let pending: Promise<T> | undefined;
  return {
    get: () => value,
    load: () => {
      pending ??= loader().then((v) => {
        value = v;
        return v;
      });
      return pending;
    },
  };
}
