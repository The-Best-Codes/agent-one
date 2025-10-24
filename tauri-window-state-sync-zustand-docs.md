Title: Loosely synchronize your (Zustand) stores in multiple Tauri processes

URL Source: https://www.gethopp.app/blog/tauri-window-state-sync

Markdown Content:
Contents[#](https://www.gethopp.app/blog/tauri-window-state-sync#contents)

---

- [Multi-window state management in Tauri and React](https://www.gethopp.app/blog/tauri-window-state-sync#multi-window-state-management-in-tauri-and-react)
- [The problem](https://www.gethopp.app/blog/tauri-window-state-sync#the-problem)
- [The solution, a loosely synced state](https://www.gethopp.app/blog/tauri-window-state-sync#the-solution-a-loosely-synced-state)
- [How to implement it](https://www.gethopp.app/blog/tauri-window-state-sync#how-to-implement-it)
- [Things to be improved](https://www.gethopp.app/blog/tauri-window-state-sync#things-to-be-improved)
- [Example codebase](https://www.gethopp.app/blog/tauri-window-state-sync#example-codebase)
- [Conclusion](https://www.gethopp.app/blog/tauri-window-state-sync#conclusion)

## Multi-window state management in Tauri and React[#](https://www.gethopp.app/blog/tauri-window-state-sync#multi-window-state-management-in-tauri-and-react)

Below I will explain how you can easily synchronize your React store, that is Zustand (used in the examples), Redux or any store you use, in multiple Tauri processes (windows). If you faced this problem before and want a relatively simple solution, this post is for you.

## The problem[#](https://www.gethopp.app/blog/tauri-window-state-sync#the-problem)

Early in the development of Hopp, we decided to use [Zustand](https://zustand.docs.pmnd.rs/?ref=hopp) for state management. Zustand is a lightweight state management library that is easy to use and has a small bundle size. Also its API is really nice and easy to understand. But there was one problem.

The state of the app is living in the main process of the window. This is great for single-window apps, but what happens in multi-window apps that want to consume the same state?

![Image 1: Hopp Multi-window example](https://dlh49gjxx49i3.cloudfront.net/tauri-state/multi-window.png)

Hopp Multi-window example

At Hopp for example, we run one window for the main control panel of our app, and then have a separate window for screen-sharing and remote control, with some of the state needed for both windows, and of course synced, as this might changed and it needs to be reflected in the other window.

To overcome this problem, we needed to make a decision, on whether to keep the state on the backend (Rust), and there is [great material](https://medium.com/@ssamuel.sushant/unifying-state-across-frontend-and-backend-in-tauri-a-detailed-walkthrough-3b73076e912c?ref=hopp) in the form of blogposts around this topic, or be creative.

![Image 2: Choose were state lives](https://www.gethopp.app/images/tauri-state/meme.jpeg)

Literally how I felt when deciding what to do with multi-window state management

While holding the state on the backend sounded solid, I really wanted to avoid losing all the reactivity that comes out of the box with Zustand (or Redux or any other state management library). Besides that, every component would be polluted with `async` calls for fetching and setting the state.

## The solution, a loosely synced state[#](https://www.gethopp.app/blog/tauri-window-state-sync#the-solution-a-loosely-synced-state)

Before we dive into the solution, let's take into consideration one crucial decision we made.

**The state would be loosely synced**

To avoid excessive complexity, we decided that the state would be **loosely synced**.

As I was searching for similar packages, I found a great package from [Klarna/Electron-Redux](https://github.com/klarna/electron-redux?ref=hopp), which also re-affirms the idea of loosely syncing the state.

But what does it mean to be loosely sync state? In simple terms, it means that there might be brief moments where our windows are not perfectly synchronized but are close enough for practical purposes.

This trade-off is acceptable, and the limitation is mainly because state in React is meant to work in a sync way, and to delegate the state so it's not loosely synced, we would need to orchestrate the state with a common back-end and this means async calls (or blocking the main thread 🙃).

## How to implement it[#](https://www.gethopp.app/blog/tauri-window-state-sync#how-to-implement-it)

The mechanism is really simple, so we decided not to ship it as a package, but rather as a simple example.

```
import { create } from "zustand";
import { emit, listen } from "@tauri-apps/api/event";
import { isEqual } from "lodash-es";

// 1. Define a simple state and actions for the example.
// This state will be shared across windows.
const useStore = create((set) => ({
  count: 0,
  user: null,

  // Actions
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  login: (name) => set({ user: { name } }),
  logout: () => set({ user: null }),
}));

// --- STATE SYNCHRONIZATION LOGIC ---

/**
 * This flag prevents an infinite loop of updates. When a window receives an
 * update from another window, it sets this flag to `true` before applying
 * the new state. This ensures that the `subscribe` function below doesn't
 * immediately re-broadcast the same state change it just received.
 */
let isProcessingUpdate = false;

/**
 * PHASE 1: BROADCASTING STATE CHANGES
 *
 * This function runs every time the state in the current window changes.
 * It sends the new state to all other windows.
 */
useStore.subscribe((currentState, previousState) => {
  console.log("Updating the state!!!");
  if (isProcessingUpdate) {
    return;
  }

  // We use `isEqual` for a deep comparison to avoid unnecessary updates
  // for objects and arrays, which might otherwise trigger a change even
  // if their contents are identical.
  if (!isEqual(currentState, previousState)) {
    emit("store-update", currentState);
  }
});

/**
 * PHASE 2: LISTENING FOR STATE CHANGES
 *
 * This listener runs whenever another window broadcasts a 'store-update' event.
 * It receives the new state and updates the current window's store.
 */
listen("store-update", (event) => {
  const newState = event.payload;

  if (!isEqual(useStore.getState(), newState)) {
    isProcessingUpdate = true;
    // Here we could do deep merging,
    // but for the sake of simplicity,
    // we just replace the state
    useStore.setState(newState);
    isProcessingUpdate = false;
  }
});

/**
 * PHASE 3: INITIAL STATE HYDRATION FOR NEW WINDOWS
 *
 * This logic ensures that when a new window opens, it gets the most
 * up-to-date state from an existing window.
 */

// A flag to ensure we only hydrate the state once on initial load.
let hasHydrated = false;

// When a new window opens, it immediately requests the current state.
emit("get-store-request");

// Existing windows will listen for this request and respond with their current state.
listen("get-store-request", () => {
  emit("get-store-response", {
    state: useStore.getState(),
  });
});

// The new window listens for the response and hydrates its own state.
listen("get-store-response", (event) => {
  if (!hasHydrated) {
    const newState = event.payload.state;

    // We set the processing flag here as well to prevent the `subscribe`
    // function from immediately broadcasting this initial state.
    isProcessingUpdate = true;
    useStore.setState(newState);
    isProcessingUpdate = false;
    hasHydrated = true;
  }
});

export default useStore;
```

To understand how it works, you can simply check the following sequence diagram. The top half part, is how the sync works when a new window is created and needs to "re-hydrate". The bottom half, is how the sync works when the state changes and the state needs to sync across windows.

![Image 3: Sequence diagram](https://www.gethopp.app/images/tauri-state/sequence.png)

Sequence diagram

## Things to be improved[#](https://www.gethopp.app/blog/tauri-window-state-sync#things-to-be-improved)

We talked about loosely syncing, but technically speaking, we may drop events while syncing state across windows.

There are some cases that may result in a race condition, but so far we have not encountered any that is a deal breaker in production with this way.

An ideal solution would probably involve the state being kept in the backend (Rust), as a JSON blob, and then a lock process to update state per window. This way we would avoid any race condition, but the problem then is the async calls, and how they will pollute the code with async/await calls. If there is any easy way to do this, please let me know at my Twitter/X account [@costasAlexoglou](https://twitter.com/costasAlexoglou/?ref=hopp).

## Example codebase[#](https://www.gethopp.app/blog/tauri-window-state-sync#example-codebase)

If you are interested in the codebase of this example, you can find it [here](https://github.com/konsalex/tauri-multi-window-state?ref=hopp).

![Image 4: Hopp Multi-window example](https://dlh49gjxx49i3.cloudfront.net/tauri-state/MultiWindowState.gif)

Hopp Multi-window example

Ditch the frustrating"Can you see my screen?" dance.

Code side-by-side, remotely.

Get started

## Conclusion[#](https://www.gethopp.app/blog/tauri-window-state-sync#conclusion)

You reached the end of the post! Hopefully you found it useful, and I am sure you are building amazing apps with Tauri! If you want feedback about your app feel free to reach me at my Twitter/X account [@costasAlexoglou](https://twitter.com/costasAlexoglou/?ref=hopp) or email me directly at [costa@gethopp.app](mailto:costa@gethopp.app?ref=hopp).
