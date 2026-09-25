# Workflow editor

A workflow editor built with Vue 3. It loads a workflow from `payload.json`, draws it as a flow chart, and lets you add, edit, move and delete nodes. Everything can be undone and redone.

- Live demo: https://workflow-viz-app.vercel.app/
- GitHub repository: https://github.com/imnayakshubham/workflow-vue

## Getting started

Needs Node `^22.18.0` or `>=24.12.0`.

```sh
git clone https://github.com/imnayakshubham/workflow-vue.git
cd workflow-vue
npm install
npm run dev
```

Then open `http://localhost:5173`.

| Script | What it does |
| --- | --- |
| `npm run dev` | Start the dev server at `http://localhost:5173` |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Serve the production build |
| `npm test` | Run the tests in watch mode |
| `npm run test:ui` | Run the tests with the Vitest dashboard |
| `npx vitest run` | Run the tests once |

No setup or environment variables are needed. The dev server proxies the payload request for you.

## Features

- **Canvas.** Nodes are drawn as a top-down tree. Each card shows an icon, a title and a short description. You can drag nodes, and pan and zoom the canvas.
- **Add a node.** Click the "+" on any line, or under the last node. A form asks for a title, a description and a type (Send Message, Add Comment or Business Hours). The new node goes between the parent and its children.
- **Edit a node.** Click a node to open the drawer. The URL changes to `/nodes/:id`, so you can link to it or reload the page. You can change the title and description, or delete the node together with everything below it.
  - Send Message: edit or remove texts, and add or remove image attachments (up to 2 MB).
  - Add Comment: edit the comment.
  - Business Hours: set a start and end time for each day, and a time zone. The Success and Failure branches cannot be opened.
- **Undo and redo.** Press Cmd/Ctrl+Z and Cmd/Ctrl+Shift+Z, or use the two buttons at the top left. Every move, add, edit and delete is one step.
- **Keyboard.** Tab moves between nodes from top to bottom. Enter or Space opens the focused node. Escape closes the drawer.

## Tech stack

Vue 3 with `<script setup>` and TypeScript, Vite, Vue Router, Pinia, TanStack Vue Query, Vue Flow, Nuxt UI v4 with Tailwind CSS v4, Vitest.

The brief lists JavaScript. TypeScript is used as a superset of it, so the components, store and utils are type-checked.

## How it works

### Folders

```text
src/
  api/
    endpoints/  the URLs for each feature
    services/   the request functions for each feature
  composables/  useWorkflow (loads the data), useWorkflowMutations (saves changes)
  stores/       the Pinia store: nodes, positions, tree actions, undo/redo
  components/
    flow/       canvas, node cards, the "+" edge, the create form
      drawer/   the drawer and one editor per node type
  utils/        pure functions: layout, node helpers, validation
  views/        FlowView, the only page
  types/        the payload types
  test/         fixtures and mount helpers for the tests
```

### Data flow

1. `useWorkflow` fetches `payload.json` with Vue Query and puts the nodes in the store.
2. `FlowView` reads the store and the route, and renders the canvas, the create form and the drawer.
3. When you add, edit, delete or move a node, a store action changes the data. The canvas re-renders from the store.
4. For add, edit and delete, a Vue Query mutation calls the store action and then the API. Add sends the whole workflow with `saveWorkflow`, because it changes several nodes at once. Edit sends only the node with `saveNode`, and delete sends only the id with `deleteNode`. If the request fails, the store rolls the change back.

There is no write endpoint, so the three save functions just return what they were given. Changes stay in memory until you reload.

The lines between nodes are not stored. Each node has a `parentId`, and the edges are worked out from that on every render.

### The store

The store holds `nodes` (the same shape as the payload), `positions` (only for nodes you dragged), and the undo/redo history.

It has four actions that change data: `addNode`, `updateNode`, `removeNode` and `moveNodes`. Each one saves a snapshot for undo and then replaces `nodes` or `positions` with a new object. Nothing is changed in place.

The mutations in `useWorkflowMutations` never touch the tree. They call a store action, save, and roll back on error. Building a new node from the form is a pure function, `buildNodes` in `utils/workflow.ts`.

So each file has one job: the util knows what a node looks like, the store knows how to change the tree, and the mutation knows how to save.

### Undo and redo

The history is two lists, `past` and `future`. A snapshot is `{ nodes, positions }`. Because the store never changes these in place, a snapshot only needs to point at the old objects. Nothing is copied.

- Every store action starts by pushing a snapshot to `past` and clearing `future`.
- Undo moves the current state to `future` and restores the last snapshot from `past`.
- Redo does the opposite.
- Rollback restores the last snapshot from `past` without adding to `future`, so a failed save leaves nothing to undo.

Cmd/Ctrl+Z is a single keydown listener on the page. It ignores key presses inside text fields, so you can still undo typing in the drawer.

If you undo the creation of the node you have open, the node disappears, the route goes back to `/` and the drawer closes.

### Routing

`/` and `/nodes/:id` both render `FlowView`. The route decides which node is open. Clicking a node pushes its URL and closing the drawer pushes `/`. The canvas is never remounted, so opening and closing the drawer is smooth.

An unknown id, or the id of a Success or Failure branch, redirects to `/`.

### Layout

`utils/layout.ts` places the nodes. A parent is centred above its children, and each child row starts below its parent's measured height. A card with a long description pushes everything below it down.

### Validation

The rules live in `utils/validation.ts` and are used by both the create form and the drawer:

- Title is required, up to 50 characters.
- Description is up to 200 characters.
- Type is required when creating.
- Attachments must be images up to 2 MB.
- Business Hours start time must be before end time.
- Texts and comments cannot be empty.

Errors show under the field. The drawer only saves when everything passes.

## Design decisions

- **Nuxt UI instead of PrimeVue.** PrimeVue 5 needs a paid license key and shows a banner without one. Nuxt UI is free, accessible and uses Tailwind.
- **Delete removes the subtree.** It keeps the tree valid, and the confirmation dialog says so.
- **The drawer edits a copy.** The canvas only changes when you press Save.
- **CORS.** The S3 bucket does not allow browser requests, so the app fetches `/api/payload.json` from its own origin. Vite proxies it in development and Vercel rewrites it in production.

## Testing

Tests live next to the code in `__tests__` folders. Fixtures and mount helpers are in `src/test/`. GitHub Actions runs the type-check and the tests on every push and pull request.

- `utils/`: layout, node helpers and every validation rule
- `stores/`: the tree actions, undo, redo and rollback
- `composables/`: the mutations, including rollback when a save fails
- `components/`: the node cards, the create form, the drawer and each editor, mounted with the real Nuxt UI components
- `views/`: routing, keyboard undo/redo, the undo button, and the drawer closing when its node is undone

## Deployment

The app is a static site on Vercel. `vercel.json` rewrites `/api/payload.json` to the S3 file and every other path to `index.html`.
