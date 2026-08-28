# Backoffice — Dashdark X

Dark admin dashboard implemented from the Figma file
[Free Dark Admin Dashboards (Community)](https://www.figma.com/design/vARAeOuenjoVCI68u0UPHW/Free-Dark-Admin-Dashboards--Community-).

## Stack

Vite + React 19 + TypeScript + Tailwind CSS v4 + React Router 7 (mirrors `../web`).

## Scripts

```bash
npm install
npm run dev      # start dev server
npm run build    # typecheck + production build
npm run lint     # oxlint
```

## Screens

| Route     | Figma node | Description                                             |
| --------- | ---------- | ------------------------------------------------------- |
| `/`       | `54-3148`  | Dashboard — stat cards, revenue / profit / session charts, device gauge, recent orders, users-by-country map |
| `/users`  | `54-8622`  | Users — summary cards + sortable users table            |
| `/jobs`   | `54-15162` | Job List — adapted from the "Product List" layout       |
| `/login`  | —          | Login — new screen designed in the same Dashdark X system |

Design tokens live in `src/index.css` (`@theme`), mapped from the file's Dev Mode variables.
