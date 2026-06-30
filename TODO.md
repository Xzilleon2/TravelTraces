`# TODO - MapsWorkspacePage UI Refactor

- [x] Refactor `frontend/src/pages/MapsWorkspacePage.tsx` button/layout density issues:

  - [ ] Replace any remaining ad-hoc button-like class strings with `WorkspaceButton` usage (or aligned styles) without removing any buttons/features.
  - [ ] Ensure all button groups use `toggleGrid`/`sm:grid-cols-2 gap-3` pattern (no tighter grids).
  - [ ] Improve sidebar spacing where wrappers are still tight (use `space-y-6`, `gap-3`, keep existing structure).
  - [ ] Add `overscroll-contain scroll-smooth` already exists in `sidebarScroll`; ensure no tighter overflow blocks remain.
  - [ ] Replace inline handlers with memoized callbacks where feasible (route generation already stable; improve map-layer selector and marker/pin actions).
- [ ] Ensure all map behavior, routing logic, export logic, drawing tools, marker systems, smart meetup planner tools, privacy controls, and map interactions remain unchanged.
- [x] Run frontend build/typecheck.

- [x] Final check: 100% zoom layout readability at 1366x768 and 1920x1080.
