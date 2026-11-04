# Shadcn Admin Dashboard

Admin Dashboard UI crafted with Shadcn and Vite. Built with responsiveness and accessibility in mind.

![alt text](public/images/shadcn-admin.png)

[![Sponsored by Clerk](https://img.shields.io/badge/Sponsored%20by-Clerk-5b6ee1?logo=clerk)](https://go.clerk.com/GttUAaK)

I've been creating dashboard UIs at work and for my personal projects. I always wanted to make a reusable collection of dashboard UI for future projects; and here it is now. While I've created a few custom components, some of the code is directly adapted from ShadcnUI examples.

> This is not a starter project (template) though. I'll probably make one in the future.

## Features

- Light/dark mode
- Responsive
- Accessible
- With built-in Sidebar component
- Global search command
- 10+ pages
- Extra custom components
- RTL support

<details>
<summary>Customized Components (click to expand)</summary>

This project uses Shadcn UI components, but some have been slightly modified for better RTL (Right-to-Left) support and other improvements. These customized components differ from the original Shadcn UI versions.

If you want to update components using the Shadcn CLI (e.g., `npx shadcn@latest add <component>`), it's generally safe for non-customized components. For the listed customized ones, you may need to manually merge changes to preserve the project's modifications and avoid overwriting RTL support or other updates.

> If you don't require RTL support, you can safely update the 'RTL Updated Components' via the Shadcn CLI, as these changes are primarily for RTL compatibility. The 'Modified Components' may have other customizations to consider.

### Modified Components

- scroll-area
- sonner
- separator

### RTL Updated Components

- alert-dialog
- calendar
- command
- dialog
- dropdown-menu
- select
- table
- sheet
- sidebar
- switch

**Notes:**

- **Modified Components**: These have general updates, potentially including RTL adjustments.
- **RTL Updated Components**: These have specific changes for RTL language support (e.g., layout, positioning).
- For implementation details, check the source files in `src/components/ui/`.
- All other Shadcn UI components in the project are standard and can be safely updated via the CLI.

</details>

## Tech Stack

**UI:** [ShadcnUI](https://ui.shadcn.com) (TailwindCSS + RadixUI)

**Build Tool:** [Vite](https://vitejs.dev/)

**Routing:** [TanStack Router](https://tanstack.com/router/latest)

**Client State:** [TanStack Store](https://tanstack.com/store/latest)

**Type Checking:** [TypeScript](https://www.typescriptlang.org/)

**Linting/Formatting:** [Biome](https://biomejs.dev/)

`pnpm check` runs lint, formatting, import sorting, and Tailwind class sorting
checks. `pnpm format` applies formatting and safe fixes. `pnpm lint` and
`pnpm format:check` run lint and formatting checks separately.
Tailwind class sorting uses Biome's nursery rule with automatic fixes enabled.
Some ESLint rules have no equivalents, including TanStack Query-specific rules
and React Compiler-specific rules. Type checking remains part of `pnpm build`.

**Icons:** [Lucide Icons](https://lucide.dev/icons/), [Tabler Icons](https://tabler.io/icons) (Brand icons only)

**Auth (partial):** [Clerk](https://go.clerk.com/GttUAaK)

## Run Locally

Clone the project

```bash
  git clone https://github.com/satnaing/shadcn-admin.git
```

Go to the project directory

```bash
  cd shadcn-admin
```

Install dependencies

```bash
  pnpm install
```

Start the server

```bash
  pnpm run dev
```

### State model

`src/stores/auth-model.ts` contains the framework-agnostic `createAuthModel`
factory. Its actions replace immutable snapshots, preserve unchanged references,
and batch session updates so subscribers receive the completed transition once.
The readonly `userStore` derives its value from the base store automatically.

`src/stores/auth-store.ts` creates the browser instance and persists token changes
to the existing cookie. React components read slices using the React adapter:

```tsx
import { useSelector } from '@tanstack/react-store'
import { authActions, authUserStore } from '@/stores/auth-store'

function AccountEmail() {
  const email = useSelector(authUserStore, (user) => user?.email)
  return <span>{email}</span>
}

// Event handlers and non-React code can call actions without subscribing.
authActions.setSession(user, accessToken)
authActions.reset()
```

The email subscription does not trigger a render for token or role changes.
Select primitives or stable references; when selecting a new object, pass
`{ compare: shallow }` with `shallow` from `@tanstack/store`.
For server rendering, create a model per request instead of sharing the browser
instance. Other renderers can use the same core with their TanStack Store adapter.

### Devtools

The development server includes one TanStack Devtools launcher with Query,
Router, and Shadcn Admin panels. The application panel inspects the current
theme, font, and direction through typed `state-request` and `state-update`
events in `src/lib/devtools-events.ts`.

Hold Shift+Alt+Ctrl (Shift+Alt+Cmd on macOS) and click an element to open its
source in your editor. The Vite plugin also pipes browser logs to the terminal
and server logs to the browser console. These features use the plugin defaults;
Devtools imports and JSX are removed from production builds by default.

## Sponsoring this project ❤️

If you find this project helpful or use this in your own work, consider [sponsoring me](https://github.com/sponsors/satnaing) to support development and maintenance. You can [buy me a coffee](https://buymeacoffee.com/satnaing) as well. Don’t worry, every penny helps. Thank you! 🙏

For questions or sponsorship inquiries, feel free to reach out at [satnaingdev@gmail.com](mailto:satnaingdev@gmail.com).

### Current Sponsor

- [Clerk](https://go.clerk.com/GttUAaK) - authentication and user management for the modern web

## Author

Crafted with 🤍 by [@satnaing](https://github.com/satnaing)

## License

Licensed under the [MIT License](https://choosealicense.com/licenses/mit/)
