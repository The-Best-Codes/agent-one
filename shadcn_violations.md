Here is the comprehensive list of all shadcn/ui guideline violations found in the provided codebase, grouped by rule category.

### 1. Form Layouts (`FieldGroup` + `Field` missing)

**Rule:** Always use `FieldGroup` + `Field` for form layouts. Never use raw `div` with `space-y-*`, `gap-*`, or grid layouts wrapping `<Label>` and `<Input>`.

- **`src/components/a1/chat-model-config.tsx`** (~Line 70, 225): Uses raw `<div className="flex flex-col gap-2">` instead of `Field`.
- **`src/components/a1/input/env-vars-editor.tsx`** (~Line 89): Uses raw layout instead of `Field`.
- **`src/components/a1/input/http-headers-editor.tsx`** (~Line 79): Uses raw layout instead of `Field`.
- **`src/routes/settings/sections/account.tsx`** (~Line 40, 56, 68): Uses raw `<div className="flex flex-col gap-2">` for User Name and Textarea fields.
- **`src/routes/settings/sections/appearance.tsx`** (~Line 158): Uses raw `div` for form fields.
- **`src/routes/settings/sections/chats.tsx`** (~Line 64): Uses raw `div` for form fields.
- **`src/routes/settings/sections/editor.tsx`** (~Line 44): Uses raw `div` for form fields.
- **`src/routes/settings/sections/extensions/built-in-extensions-tab.tsx`** (~Line 115, 126): Uses raw `div` for inputs and toggles.
- **`src/routes/settings/sections/extensions/install-extension-dialog.tsx`** (~Line 33): Uses raw `grid gap-1.5` wrapper.
- **`src/routes/settings/sections/extensions/mcp-server-config-form.tsx`** (~Line 56): Uses raw `div className="grid gap-2"` wrapping `<Label>` and `<Input>`.
- **`src/routes/settings/sections/messages.tsx`** (~Line 55): Uses raw `div` for form fields.
- **`src/routes/settings/sections/performance.tsx`** (~Line 34): Uses raw `div` for form fields.
- **`src/routes/settings/sections/providers/add-openai-compatible-dialog.tsx`** (~Line 76): Uses raw `div` for form fields.
- **`src/routes/settings/sections/providers/model-list.tsx`** (~Line 126, 172): Uses raw `div` for Add Model form.
- **`src/routes/settings/sections/titles.tsx`** (~Line 44): Uses raw `div` for form fields.

### 2. Input Groups (`InputGroup` missing)

**Rule:** Never place a `Button` or icon directly inside or adjacent to an `Input` with custom positioning. Compose with `InputGroup` + `InputGroupAddon`.

- **`src/components/a1/input/secret-input.tsx`** (~Line 47): Wraps `<Input>` and `<Button>` in a raw `<div className="flex gap-2">` instead of using `InputGroup`.
- **`src/components/a1/sidebar/virtualized-chat-list.tsx`** (~Line 163): Uses a raw `div` with a custom absolute-positioned `<SearchIcon>` inside the `<Input>` wrapper.
- **`src/routes/settings/sections/extensions/index.tsx`** (~Line 210): Places a custom absolute-positioned `<SearchIcon>` next to an `<Input>` inside a raw `div`.

### 3. Empty States (Custom markup instead of `<Empty>`)

**Rule:** Use the `Empty` component for empty states. Don't build custom styled empty state markup.

- **`src/components/a1/empty-states/no-custom-extensions.tsx`** (~Line 3): Custom styled `div` for empty extensions.
- **`src/components/a1/empty-states/no-messages.tsx`** (~Line 24): Custom styled `div` and `h1` for empty chat.
- **`src/components/a1/input/env-vars-editor.tsx`** (~Line 161): Custom `<p className="...">No environment variables</p>`.
- **`src/components/a1/input/http-headers-editor.tsx`** (~Line 136): Custom `<p className="...">No headers</p>`.
- **`src/components/a1/sidebar/virtualized-chat-list.tsx`** (~Line 185, 189): Custom `<div className="...">No chats yet</div>`.
- **`src/routes/settings/sections/extensions/built-in-extensions-tab.tsx`** (~Line 84): Custom styled `div` for no search results.
- **`src/routes/settings/sections/extensions/extensions-browser.tsx`** (~Line 101): Custom styled `div` for no installed extensions.
- **`src/routes/settings/sections/extensions/index.tsx`** (~Line 313): Custom styled `div` for custom extensions empty state.
- **`src/routes/settings/sections/providers/model-list.tsx`** (~Line 269): Custom `<p className="...">No models</p>`.

### 4. Icons inside `<Button>` (`data-icon` missing & sizing classes used)

**Rule:** Icons inside a `<Button>` must use the `data-icon="inline-start"` or `"inline-end"` attribute. Do not use sizing classes (like `size-4`) on the icon.

- **`src/components/a1/chat-model-config.tsx`** (~Line 60, 233, 322)
- **`src/components/a1/chat-model-selector.tsx`** (~Line 158, 167)
- **`src/components/a1/input/attachments.tsx`** (~Line 66)
- **`src/components/a1/input/env-vars-editor.tsx`** (~Line 98, 105, 109, 142, 150)
- **`src/components/a1/input/error-section.tsx`** (~Line 34, 41)
- **`src/components/a1/input/http-headers-editor.tsx`** (~Line 89, 97, 102, 127)
- **`src/components/a1/input/incomplete-section.tsx`** (~Line 30)
- **`src/components/a1/input/no-model-section.tsx`** (~Line 26)
- **`src/components/a1/input/secret-input.tsx`** (~Line 55, 66, 76)
- **`src/components/a1/markdown/codeblock/index.tsx`** (~Line 62)
- **`src/components/a1/messages/action-row/branch-button.tsx`** (~Line 22)
- **`src/components/a1/messages/action-row/edit-button.tsx`** (~Line 22)
- **`src/components/a1/messages/action-row/retry-button.tsx`** (~Line 31)
- **`src/components/a1/messages/index.tsx`** (~Line 207, 216, 223, 245)
- **`src/components/a1/messages/parts/dynamic-tool.tsx`** (~Line 80, 88)
- **`src/components/a1/messages/tools/tool-call.tsx`** (~Line 40, 48)
- **`src/components/a1/sidebar/index.tsx`** (~Line 60, 131, 143, 183, 193)
- **`src/components/a1/sidebar/modals/bulk-export-modal.tsx`** (~Line 47)
- **`src/components/a1/sidebar/modals/change-title-modal.tsx`** (~Line 65)
- **`src/components/a1/sidebar/modals/export-chat-modal.tsx`** (~Line 43)
- **`src/components/a1/sidebar/virtualized-chat-list.tsx`** (~Line 125, 132, 148, 156)
- **`src/components/error-boundary.tsx`** (~Line 82)
- **`src/routes/onboarding/steps/account.tsx`** (~Line 60, 90)
- **`src/routes/onboarding/steps/welcome.tsx`** (~Line 37, 44, 50, 52)
- **`src/routes/settings/index.tsx`** (~Line 51, 56, 74)
- **`src/routes/settings/sections/about.tsx`** (~Line 124, 129, 134, 139)
- **`src/routes/settings/sections/appearance.tsx`** (~Line 175, 206)
- **`src/routes/settings/sections/chats.tsx`** (~Line 111, 140, 169, 198, 222, 245, 269, 298, 323, 345, 362)
- **`src/routes/settings/sections/editor.tsx`** (~Line 59, 81, 107, 136)
- **`src/routes/settings/sections/extensions/built-in-extensions-tab.tsx`** (~Line 92)
- **`src/routes/settings/sections/extensions/extension-list-row.tsx`** (~Line 74, 90)
- **`src/routes/settings/sections/extensions/index.tsx`** (~Line 228, 257)
- **`src/routes/settings/sections/extensions/install-extension-dialog.tsx`** (~Line 45)
- **`src/routes/settings/sections/messages.tsx`** (~Line 81, 105, 129, 153, 182, 211)
- **`src/routes/settings/sections/performance.tsx`** (~Line 49, 73, 97, 128)
- **`src/routes/settings/sections/providers/add-provider-dropdown.tsx`** (~Line 26)
- **`src/routes/settings/sections/providers/custom-provider-list-item.tsx`** (~Line 104)
- **`src/routes/settings/sections/titles.tsx`** (~Line 38)
- **`src/routes/tests/index.tsx`** (~Line 16)
- **`src/routes/tests/notifications/index.tsx`** (~Line 58)

### 5. Icon Sizing Inside General Components

**Rule:** No sizing classes on icons inside components (they handle sizing via CSS). Do not use `size-4`, `w-4 h-4`, etc.

- **`src/components/a1/chat-model-selector.tsx`** (~Line 65): `<CheckIcon className="size-4" />` inside `CommandItem`.
- **`src/components/a1/input/attachments.tsx`** (~Line 41, 45): Sizing classes on icons inside attachment displays.
- **`src/components/a1/messages/parts/dynamic-tool.tsx`** (~Line 59, 100, 109, 118, 150, 157, 196, 203, 272): Manual `size-4` on multiple icons inside `AccordionTrigger` and other containers.
- **`src/components/a1/messages/parts/file.tsx`** (~Line 23, 41, 48): Sizing classes on `FileImageIcon`, `FileIcon`, `FileTextIcon`.
- **`src/components/a1/messages/parts/reasoning.tsx`** (~Line 46, 53, 60): Sizing classes on icons inside `AccordionTrigger`.
- **`src/components/a1/messages/tools/tool-call.tsx`** (~Line 31, 55, 61, 71, 91, 114, 137...): Sizing classes throughout all tool files (`tool-dateTime.tsx`, `tool-getUrlContent.tsx`, etc.).
- **`src/components/a1/sidebar/chat-item.tsx`** (~Line 48, 69, 98, 108, 119, 128, 142, 151, 160, 167): Manual `size-*` on `<SplitIcon>`, and icons inside `DropdownMenuItem` & `ContextMenuItem`.
- **`src/components/error-boundary.tsx`** (~Line 68): `size-4` on icon in `AccordionTrigger`.
- **`src/components/theme/toggle-menu.tsx`** (~Line 38, 44, 50): `size-4` on icons inside `ToggleGroupItem`.

### 6. Loading Buttons

**Rule:** Buttons have no `isLoading` or custom spinner prop. Compose explicitly using the `<Spinner>` component + `data-icon` + `disabled`.

- **`src/components/a1/input/main-chat-input.tsx`** (~Line 342): Uses `<Loader2Icon className="animate-spin" />` instead of `<Spinner>`.
- **`src/components/a1/sidebar/modals/change-title-modal.tsx`** (~Line 63): Uses `<Loader2Icon className="animate-spin" />` inside the generate Button.
- **`src/components/a1/web-auth/auth-status-display.tsx`** (~Line 83): Uses `<Loader2Icon className="animate-spin" />` inside the Sign Out button.
- **`src/routes/settings/sections/about.tsx`** (~Line 129): Uses `<Loader2 className="animate-spin" />` inside Checking Button.
- **`src/routes/settings/sections/extensions/mcp-auth-status.tsx`** (~Line 66, 91, 95): Uses `<Loader2Icon className="animate-spin" />` inside Login/Logout buttons.

### 7. Custom Loading Skeletons

**Rule:** Use the `Skeleton` component for loading placeholders. Never build custom styled divs with `animate-pulse`.

- **`src/components/a1/chat-message-loading.tsx`** (~Line 31, 40, 58): Uses `<span className="text-muted-foreground animate-pulse">` for loading placeholders instead of `<Skeleton>`.

### 8. Manual Theme Colors (`dark:`)

**Rule:** Use semantic tokens for dark mode support. No manual `dark:` overrides on text or backgrounds.

- **`src/components/a1/chat-usage-status.tsx`** (~Line 100): `dark:hover:bg-accent/50`.
- **`src/components/a1/input/main-chat-input.tsx`** (~Line 300): `dark:bg-secondary`.
- **`src/routes/settings/sections/extensions/extension-list-row.tsx`** (~Line 62): `dark:text-blue-400`.

### 9. Validation State Data Attributes

**Rule:** Validation uses both `data-invalid` / `data-disabled` on the `Field` wrapper, and `aria-invalid` / `disabled` on the control.

- **`src/components/a1/input/env-vars-editor.tsx`** (~Line 130): Applies `aria-invalid={hasError}` to `<Input>` but lacks a surrounding `Field` with `data-invalid`.
- **`src/components/a1/input/http-headers-editor.tsx`** (~Line 120): Applies `aria-invalid={hasError}` to `<Input>` but lacks a surrounding `Field` with `data-invalid`.

### 10. Manual Z-Index on Overlay Components

**Rule:** Overlays (Dialog, Sheet, Custom Overlays, etc.) handle their own stacking natively. Never add `z-50` or manual `z-*` mapping in application logic.

- **`src/components/a1/chat-usage-status.tsx`** (~Line 34): Manually sets `z-40` on a fixed container.
- **`src/components/a1/sidebar/index.tsx`** (~Line 171): Manually sets `z-50` on the fixed sidebar top wrapper.
- **`src/components/a1/input/main-chat-input.tsx`** (~Line 250, 324): Custom overlay layers explicitly using `z-20` and `z-10`.
