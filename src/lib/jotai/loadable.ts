import { type Atom, atom } from "jotai";
import { unwrap } from "jotai/utils";

type Loadable<Value> =
  | { state: "loading" }
  | { state: "hasData"; data: Awaited<Value> }
  | { state: "hasError"; error: unknown };

const LOADING: Loadable<unknown> = { state: "loading" };

export function loadable<Value>(anAtom: Atom<Value>): Atom<Loadable<Value>> {
  const unwrappedAtom = unwrap(anAtom, () => LOADING);
  return atom((get) => {
    try {
      const data = get(unwrappedAtom);
      if (data === LOADING) {
        return LOADING as Loadable<Value>;
      }
      return { state: "hasData", data } as Loadable<Value>;
    } catch (error) {
      return { state: "hasError", error } as Loadable<Value>;
    }
  });
}
