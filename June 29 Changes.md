# June 29 Changes

## Brand and Positioning

- Renamed visible `Yapak` and `Layag` labels to `TravelTraces`.
- Renamed the old toolbar component from `LayagToolbar` to `TravelTracesToolbar`.
- Updated app metadata and project documentation references to use `TravelTraces`.
- Reworked the landing page messaging to focus on Southeast Asia instead of only the Philippines.
- Updated landing page examples, stats, story cards, hero text, and CTA copy for Southeast Asia coverage.

## Run and Setup

- Updated `run.cmd` so it detects a broken backend virtual environment created on another Windows account.
- The launcher now recreates `backend/.venv` when the stored Python path is invalid.

## Map Layers

- Limited the map layer choices to:
  - Street Map
  - Satellite Map
  - 3D Globe Map
- Removed the extra Terrain, Traffic, Transit, Biking, and More map layer choices.
- Updated the Satellite Map icon so it uses the same clean tile style as Street Map.

## Map Tools and Panels

- Made Map Tools, Travel Tools, and Map Mode popups act as tool choosers.
- Tool popups now close after selecting a tool.
- Added a right-side tool panel inside the map frame.
- Moved tool forms into the right-side panel:
  - Export Map
  - Path Finder
  - Draw Route
  - Live Travel Sharing
  - Smart Meetup Planner
  - Travel Markers
  - Saved Tourist Spots
- Added Export Map as a button in Map Tools.
- Added visible shortcut text inside tool descriptions.

## Map Shortcuts and Cursors

- Added shortcuts:
  - `Ctrl+P`: Pan
  - Mouse wheel: zoom in/out
  - `Ctrl+-`: zoom out
  - `Ctrl+B`: box zoom
  - `Ctrl+E`: export map
  - `Ctrl+D`: draw route
  - `Ctrl+M`: drop marker
  - `Ctrl+F`: pick route start
  - `Ctrl+T`: pick route destination
  - `Ctrl+L`: live sharing
  - `Ctrl+K`: smart meetup planner
  - `Ctrl+Shift+S`: saved tourist spots
  - `Ctrl+Alt+1/2/3`: Street, Satellite, 3D Globe
  - `Ctrl+1/2/3`: Private, Group, Public map modes
- Added distinct cursor styles for pan, zoom box, drawing, marker placement, and route-point picking.

## Site-Wide UX and Design

- Added global hidden scrollbars while keeping scrolling enabled.
- Added subtle route and section animations across the app.
- Added reduced-motion support.
- Added skeleton loading for lazy-loaded routes.
- Added shimmer loading styling.
- Added lazy loading and async decoding behavior for images after route changes.
- Added global visual polish through shared CSS tokens, animation utilities, and page shell behavior.

## Music

- Added a Music Box using `music/Mangrove Map Drift.mp3`.
- Copied the track into `frontend/public/music/` so the browser can serve it.
- Initially added a floating music toggle, then moved the music control into the profile dropdown.
- Playback state is shared so music can continue even after the dropdown closes.

## Chat

- Updated the chat box palette to match the TravelTraces website colors:
  - Cream surfaces
  - Forest green headers and actions
  - Sage accents
  - Warm orange unread indicators
- Kept chat scrolling functional while hiding visible scrollbars.

## Performance and Build

- Converted page routes to lazy-loaded imports.
- Added an app-level skeleton fallback during route loading.
- Verified the frontend with:
  - `npm run lint`
  - `npm run build`
