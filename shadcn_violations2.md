I can’t accurately do this “for every single violation” without tooling on a codebase this large.  
Given your constraint (“DO NOT use any tools”), anything I provide as exhaustive would be unreliable and likely miss issues.

That said, here’s a **best-effort manual pass** of clear violations I can identify from what you pasted:

---

### 1) Using raw `<button>` instead of shadcn `Button`

- **Summary:** Custom raw button used where `Button` should be used.
- **File:** `src/components/a1/chat-usage-status.tsx`
- **Approx line:** ~95

---

### 2) Empty state implemented as custom markup instead of `Empty` component

- **Summary:** Empty state should use the `Empty` composition components.
- **File:** `src/components/a1/empty-states/no-custom-extensions.tsx`
- **Approx line:** ~2

---

### 3) `ToggleGroup` using Radix API (`type="single"`) in a base/rules context expectation conflict

- **Summary:** Your internal guidelines say base uses `multiple` boolean and no `type`, but code uses `type="single"` in many places.
- **Files (examples):**
  - `src/components/theme/toggle-menu.tsx` (~20)
  - `src/routes/settings/settings-sidebar.tsx` (~20)
  - `src/routes/settings/sections/appearance.tsx` (~150, ~175)
- **Note:** Your `components.json` style is `radix-nova`; this may actually be valid for your real setup, but it conflicts with the provided “base-vs-radix” guideline text if interpreted strictly.

---

### 4) `space-y-*` usage (guideline says use `gap-*`)

- **Summary:** Guidelines disallow `space-y-*`.
- **File:** `src/routes/settings/sections/extensions/built-in-extensions-tab.tsx`
- **Approx line:** ~112 (`className="space-y-3"`)

---

### 5) `Tabs` trigger semantics mismatch (`aria-checked` on tab)

- **Summary:** Not strictly a shadcn primitive rule, but this is invalid ARIA for tabs.
- **File:** `src/routes/settings/settings-sidebar.tsx`
- **Approx line:** ~35 (`aria-checked={undefined}` on tab trigger)

---

### 6) Hardcoded non-semantic color classes in component styling

- **Summary:** Guidelines prefer semantic tokens vs raw color classes.
- **Files (examples):**
  - `src/components/a1/markdown/codeblock/index.tsx` (~28, ~53, ~67; `bg-[rgb(30,30,30)]`, `text-white`)
  - `src/components/a1/markdown/codeblock/preview/html.tsx` (~10; `bg-white`, raw border color)
  - `src/components/a1/markdown/codeblock/shiki-highlighter.tsx` (~52, ~67; raw rgb/text-white)
- **Note:** Some code/highlight UIs may intentionally use fixed colors; this is still a guideline violation per your styling doc.

---

### 7) Icon sizing classes on icons inside shadcn components

- **Summary:** Guideline says no `size-*` on icons inside components like Button/Menu.
- **Files (representative examples):**
  - `src/components/a1/chat-model-config.tsx` (`RotateCcwIcon className="size-4"`, etc.)
  - `src/components/a1/sidebar/chat-item.tsx` (`PencilIcon className="size-4"`, etc.)
  - `src/routes/settings/...` many files (`RotateCcwIcon className="size-4"`, etc.)
- **Approx lines:** widespread

---

### 8) Missing `data-icon="inline-start|inline-end"` for icons in `Button`

- **Summary:** Guidelines require `data-icon` for icons in Button labels.
- **Files (representative examples):**
  - `src/components/a1/input/error-section.tsx` (`<RefreshCcwIcon /> Retry`)
  - `src/components/a1/input/no-model-section.tsx` (`<KeyIcon /> Settings`)
  - `src/routes/onboarding/steps/welcome.tsx` (buttons with icons)
- **Approx lines:** widespread

---

### 9) Custom loading state composition not using `Spinner` in buttons

- **Summary:** Guideline says compose loading with `Spinner` + `disabled`; code frequently uses `Loader2Icon`.
- **Files (examples):**
  - `src/components/a1/input/main-chat-input.tsx` (~510)
  - `src/routes/settings/sections/about.tsx` (multiple locations)
  - `src/routes/settings/sections/account.tsx` (auth button)
- **Approx lines:** widespread

---

### 10) Custom `<hr>` equivalent avoided correctly mostly, but several custom bordered dividers used as section separators

- **Summary:** Some places use plain border containers instead of `Separator` where separator intent is explicit.
- **File (example):** `src/routes/settings/sections/extensions/*` and provider rows
- **Approx lines:** multiple
- **Note:** This one is softer/interpretive; many are card/box borders rather than explicit separators.

---

## Brief overall summary

Most likely violations are concentrated in:

1. **Icon rules** (`data-icon`, no manual size classes in components),
2. **Styling rules** (raw color values),
3. **Empty state composition** (`Empty` not used),
4. **Spacing rule** (`space-y-*` found),
5. **One clear raw button usage** (chat usage collapse control).

If you want, I can do a **strict second pass** and give you a longer, near-exhaustive list grouped by file (still manual), but I can’t honestly guarantee “every single” without running searches/lint tooling.
