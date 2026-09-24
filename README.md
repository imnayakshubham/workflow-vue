# Workflow

A flow chart editor built with Vue 3. It loads a workflow from `payload.json`, draws it as a tree with Vue Flow, and lets you create, edit, move and delete nodes.

## Features

- **Canvas:** nodes render from the payload in a top-down tree and can be dragged. Each card shows an icon, a title and a shortened description.
- **Create node:** use the "Create New Node" button or the "+" on any line or under any last node. The form has Title, Description and Type (Send Message, Add Comments, Business Hours), all validated.
- **Details drawer:** click a node to open it. The URL becomes `/nodes/:id`, so the drawer can be linked to and survives a reload. Clicking the node again closes it.
  - Every node: edit title and description, or delete it (this also removes everything below it, after a confirmation).
  - Send Message: attachments as image tiles with upload (images up to 2 MB) and remove, plus editable texts you can remove.
  - Add Comment: edit or clear the comment.
  - Business Hours: a start and end time for each day, plus a time zone. Success and Failure are display-only.

## Getting started

Requires Node `^22.18.0` or `>=24.12.0`.

```sh
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | Dev server at http://localhost:5173 |
| `npm run build` | Type-check and production build |
| `npm run preview` | Serve the production build |
| `npm test` | Vitest in watch mode |
| `npx vitest run` | Run the tests once |

## Tech stack

Vue 3 (`<script setup>`, TypeScript), Vite, Vue Router, Pinia, TanStack Vue Query, Vue Flow, Nuxt UI v4 with Tailwind CSS v4, Vitest with Vue Test Utils.

## Architecture

```
src/
  api/          fetches payload.json
  composables/  useWorkflow (query), useWorkflowMutations (create, update, delete)
  stores/       editor store (dragged node positions)
  components/
    flow/       canvas, node cards, the "+" edge
    drawer/     details drawer and one editor per node type
  utils/        pure logic: tree layout, node helpers, validation, time, files
  views/        FlowView, the only route view
```

**How data moves**
- Vue Query owns the workflow data (`['workflow']`). It uses the query config the spec requires: `staleTime: Infinity`, `gcTime: 1h`, `refetchOnWindowFocus: false`, `networkMode: 'always'`.
- Creating, updating and deleting are Vue Query mutations. Each one runs a pure function from `utils/workflow.ts` and writes the result back to the cache with `setQueryData`. The payload is a static read-only file, so changes live in the cache and nothing is refetched.
- Pinia holds editor state that isn't part of the payload: where you dragged each node.
- Vue Router holds which node is open. `/` and `/nodes/:id` render the same view, so opening the drawer never remounts the canvas.

## Design decisions

- **Nuxt UI instead of PrimeVue.** PrimeVue 5 now needs a commercial license key and shows a license banner without one. Nuxt UI is MIT licensed, built on Reka UI for accessibility, and uses Tailwind.
- **Custom tree layout** (`utils/layout.ts`). A parent is centred above its children, and each row sits below the measured height of the card above it. Cards can therefore grow with their content and the lines stay tidy.
- **The "+" is a custom edge.** It sits at the midpoint of each line, so it stays centred whatever the card sizes. Adding after a node puts the new node between it and its existing children. Adding a Business Hours node moves the existing children under its Success branch. There is no "+" directly under Business Hours, because nothing may sit between it and its Success/Failure branches.
- **Descriptions.** The payload has no description field. Cards show a stored description when there is one, otherwise a description derived from the node (for example "Business Hours - UTC").
- **Drafts in the drawer.** The drawer edits a copy and only saves when you press Save and the checks pass, so the chart never shows half-finished edits.
- **Delete removes the subtree.** This keeps the tree valid and predictable. The confirmation dialog says so.
- **CORS proxy.** The S3 bucket sends no CORS headers, so the app fetches `/api/payload.json`. `vite.config.ts` proxies that path in development and `vercel.json` rewrites it in production.

## Testing

Tests sit next to the code in `__tests__` folders. They cover:
- the pure utilities: layout, node helpers, validation, time and file helpers
- the mutations against a real `QueryClient`
- the node cards, the create modal, the drawer and each editor, mounted with the real Nuxt UI components
- `FlowView` routing: opening from the URL, toggling, and redirecting unknown ids
