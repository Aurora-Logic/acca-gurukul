# Admin Panel Template

A ready-to-use admin panel template built with React, Vite, Tailwind CSS, and shadcn/ui. Use it as a starting point and extend it with your own pages.

## Tech Stack

- **React 19** with React Router for client-side routing
- **Vite 8** for fast dev server and builds
- **TypeScript** with strict mode for type safety
- **ESLint** with typescript-eslint for code quality
- **Tailwind CSS 4** for utility-first styling
- **shadcn/ui** (Radix UI) for accessible, pre-built components
- **Recharts** for dashboard charts
- **TanStack Table** for data tables
- **Tiptap** for rich text editing
- **Lucide React** for icons

## Folder Structure

```
├── index.html                        # HTML entry point
├── vite.config.ts                    # Vite configuration (aliases, server, build)
├── tsconfig.json                     # TypeScript configuration
├── eslint.config.js                  # ESLint configuration
├── package.json                      # Dependencies and scripts
├── components.json                   # shadcn/ui configuration
├── public/                           # Static assets (favicon, images)
│
└── src/
    ├── index.css                     # Global styles and Tailwind imports
    ├── admin.tsx                     # App entry — routing and lazy-loaded pages
    ├── mock-data.ts                  # Sample data for demo pages
    │
    ├── components/
    │   ├── admin/
    │   │   └── AdminLayout.tsx       # Sidebar + header shell (wraps all pages)
    │   ├── DraftBanner.tsx           # Reusable draft status banner
    │   ├── SeoFields.tsx             # Reusable SEO meta fields
    │   └── ui/                       # shadcn/ui components (button, card, table, etc.)
    │
    ├── hooks/
    │   ├── use-mobile.ts             # Mobile breakpoint detection
    │   ├── useAutosave.ts            # Auto-save hook
    │   └── useDebounce.ts            # Debounce hook
    │
    ├── lib/
    │   ├── utils.ts                  # Utility functions (cn, etc.)
    │   └── dates.ts                  # Date formatting helpers
    │
    └── Pages/Admin/                  # All admin pages
        ├── Dashboard.tsx
        ├── Appointments/              # Index, Create, Show
        ├── Blog/                      # Index, Create, Edit
        ├── Contacts/                  # Index, Show
        ├── Users/                     # Index, Create, Edit
        └── Seo/                       # Index, Edit
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm (or any package manager)

### Install and Run

```bash
# Install dependencies
npm install

# Start dev server at http://localhost:5173
npm run dev

# Build for production (runs typecheck first)
npm run build

# Preview production build
npm run preview

# Type check
npm run typecheck

# Lint
npm run lint
```

## Adding a New Page

1. Create your page component inside `src/Pages/Admin/`:

   ```
   src/Pages/Admin/Products/Index.tsx
   ```

2. Wrap your page content with `AdminLayout`:

   ```tsx
   import AdminLayout from '@/components/admin/AdminLayout';

   export default function ProductsIndex() {
       return (
           <AdminLayout>
               <h1>Products</h1>
               {/* your content */}
           </AdminLayout>
       );
   }
   ```

3. Register the route in `src/admin.tsx`:

   ```tsx
   const ProductsIndex = lazy(() => import('./Pages/Admin/Products/Index'));

   // inside <Routes>
   <Route path="/admin/products" element={<ProductsIndex />} />
   ```

4. Add a sidebar link in `AdminLayout.tsx` to make it navigable.

## Path Aliases

The `@` alias points to `src/`, so you can import like:

```tsx
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
```
