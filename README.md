# Workflow

A flow chart editor built with Vue 3. It loads a workflow from `payload.json`, draws it as a tree with Vue Flow, and lets you create, edit, move and delete nodes.

## Features

- **Canvas:** nodes render from the payload in a top-down tree and can be dragged. Each card shows an icon, a title and a shortened description.
- **Create node:** use the "+" on any line or under any last node. An empty workflow shows a "Create New Node" button in the middle of the canvas instead. The form has Title, Description and Type (Send Message, Add Comments, Business Hours), all validated.
- **Details drawer:** click a node to open it. The URL becomes `/nodes/:id`, so the drawer can be linked to and survives a reload. Clicking the empty canvas or pressing Escape closes it. Nodes can also be selected with the keyboard (Tab to a node, then Enter or Space), which is Vue Flow's built-in accessibility. Tab walks the nodes top-down, and the focused node shows a ring.
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

## Deployment

The app deploys to Vercel as a static site. `vercel.json` rewrites `/api/payload.json` to the S3 file (the bucket sends no CORS headers) and every other path to `index.html` for the client-side routes.

## Tech stack

Vue 3 (`<script setup>`, TypeScript), Vite, Vue Router, Pinia, TanStack Vue Query, Vue Flow, Nuxt UI v4 with Tailwind CSS v4, Vitest with Vue Test Utils.

## Architecture

```
src/
  api/          fetches payload.json
  composables/  useWorkflow (query), useWorkflowMutations (create, update, delete)
  stores/       workflow store (nodes and dragged positions)
  components/
    flow/       canvas, node cards, the "+" edge, create modal
      drawer/   details drawer and one editor per node type
  utils/        pure logic: tree layout, node helpers, validation, time, files
  views/        FlowView, the only route view
```

**How data moves**
- **Vue Query** fetches `payload.json` (`useWorkflow`) with the query config the spec requires: `staleTime: Infinity`, `gcTime: 1h`, `refetchOnWindowFocus: false`, `networkMode: 'always'`. The result is put into the Pinia store.
- **Pinia** (`stores/workflow.ts`) stores the data the UI renders: `nodes`, in the same shape as the API response, and `positions` for dragged nodes.
- **Every change is an optimistic Vue Query mutation** (`useWorkflowMutations`). `onMutate` saves the current nodes, changes the store straight away and returns the old nodes. `onError` puts them back if the save fails. The create, update and delete logic is written out inside each `onMutate`, so you can read what each one does in one place.
- **`saveWorkflow`** stands in for a save request. `payload.json` is a read-only file with no write endpoint, so it just resolves.
- **Vue Router** holds which node is open. `/` and `/nodes/:id` render the same view, so opening the drawer never remounts the canvas.

## Design decisions

- **Nuxt UI instead of PrimeVue.** PrimeVue 5 now needs a commercial license key and shows a license banner without one. Nuxt UI is MIT licensed, built on Reka UI for accessibility, and uses Tailwind.
- **Custom tree layout** (`utils/layout.ts`). A parent is centred above its children, and each row sits below the measured height of the card above it. Cards can therefore grow with their content and the lines stay tidy.
- **The "+" is a custom edge.** It sits at the midpoint of each line, so it stays centred whatever the card sizes. Adding after a node puts the new node between it and its existing children. Adding a Business Hours node moves the existing children under its Success branch. There is no "+" directly under Business Hours, because nothing may sit between it and its Success/Failure branches.
- **Descriptions.** The payload has no description field. Cards show a stored description when there is one, otherwise a description derived from the node (for example "Business Hours - UTC").
- **Same shape as the API.** New nodes are built exactly like the API's (Business Hours includes `connectors` and `action`). The only extra field is an optional `description`, because the spec asks for an editable description and the API has none.
- **Drafts in the drawer.** The drawer edits a copy and only saves when you press Save and the checks pass, so the chart never shows half-finished edits.
- **Delete removes the subtree.** This keeps the tree valid and predictable. The confirmation dialog says so.
- **CORS proxy.** The S3 bucket sends no CORS headers, so the app fetches `/api/payload.json`. `vite.config.ts` proxies that path in development and `vercel.json` rewrites it in production.
- **Edits live in memory.** The assignment has no write endpoint, so `saveWorkflow` returns its input and edits and dragged positions are kept only in the Pinia store. A reload restores the original payload.

## Testing

Tests sit next to the code in `__tests__` folders. The shared fixtures (each API node by name, such as `awayMessage` or `businessHours`) and mount helpers are in `src/test/`. The tests cover:
- the pure utilities: layout, node helpers and validation
- the optimistic mutations, including the rollback when a save fails
- the node cards, the create modal, the drawer and each editor, mounted with the real Nuxt UI components
- `FlowView` routing: opening from the URL, closing, and redirecting unknown ids
