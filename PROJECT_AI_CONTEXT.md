# TravelPlaces AI Project Context

This document is a compact handoff file for another AI or developer. It explains the current TravelPlaces/TravelTraces project, feature progress, major files, and how frontend, backend, database, mapping, authentication, and geospatial flows connect.

Last verified locally:

- Frontend build: `cd frontend && npm.cmd run build` passes.
- Frontend type check: `cd frontend && npm.cmd run lint` passes. In this project, `lint` runs `tsc --noEmit`.
- There is no `npm run typecheck` script.

## 1. Project Purpose

TravelPlaces is a travel exploration, social mapping, meetup planning, and travel memory platform focused on Southeast Asia and the Philippines.

Core product themes:

- Discover tourist destinations.
- Create user-owned maps.
- Use private, group, and public/community map scopes.
- Drop map markers that can become travel posts with notes and photos.
- Save tourist spots into collections.
- Plan routes and smart meetup points.
- Share live travel location optionally.
- View map workspaces in Street, Satellite, Terrain, and 3D Globe modes.
- Manage travel groups, notifications, and account deletion.

The product should remain travel-focused. Avoid turning the platform into family surveillance, school/home/work monitoring, or household management.

## 2. High-Level Architecture

```text
frontend React/Vite app
  -> frontend/src/services/*.ts API clients
  -> FastAPI backend routers
  -> backend/app/core/map_store.py service facade
  -> backend/app/core/database.py SQLite persistence
  -> backend/data/TravelPlaces.db
  -> backend/data/uploads for media files
```

Main runtime pieces:

- Frontend: React 19, TypeScript, Vite, Tailwind CSS utilities, MapLibre GL, CesiumJS, Leaflet/react-leaflet, lucide-react, motion.
- Backend: FastAPI, Pydantic, SQLite, Argon2 auth hashing, JWT/cookie sessions, OSRM/Nominatim/Photon geospatial services, Shapely/GeoPandas support for meetup regions.
- Map rendering: MapLibre for 2D vector maps; CesiumJS for 3D globe.
- Storage: SQLite database is the intended source of truth. Legacy JSON exists as migration/compatibility state, especially `backend/data/map_state.json`.
- Media: backend-managed upload paths under `/media/uploads`; frontend should never store raw local client file paths.

## 3. Repository Layout

```text
TravelPlaces/
  backend/
    app/
      core/
      models/
      routers/
      main.py
    data/
      TravelPlaces.db
      map_state.json
      uploads/
    requirements.txt
  frontend/
    src/
      assets/
      components/
      context/
      pages/
      security/
      services/
      styles/
      utils/
      App.tsx
      main.tsx
    package.json
  Icons/
  PROJECT_AI_CONTEXT.md
```

## 4. Frontend Entry and Routing

### `frontend/src/main.tsx`

Mounts the React app.

### `frontend/src/App.tsx`

Defines the app shell:

- Wraps everything in `AuthProvider`.
- Uses `BrowserRouter`.
- Renders `Navbar`, routed page content, `Footer` except on `/maps`, `AuthModal`, and global `CustomCursor`.

Important routes:

```text
/                         LandingPage
/maps                     MapsWorkspacePage
/geo-photos               GeoreferencedPhotosPage
/travel-groups            TravelGroupsPage
/saved-places             SavedTouristSpotsPage
/events                   EventsPage
/explore                  ExplorePage
/stories                  StoriesPage
/profile                  ProfilePage
/account/delete           AccountDeletionPage
/map                      MapPage
/map/layers               MappingLayerPage
```

## 5. Authentication and User State

### Frontend

`frontend/src/context/AuthContext.tsx`

- Central frontend auth state.
- Calls backend through `frontend/src/services/authApi.ts`.
- Provides `user`, `isAuthenticated`, `authReady`, `login`, `signup`, `logout`, `updateUser`, and auth modal controls.
- Has a demo fallback user if backend auth calls fail. This keeps the UI usable in local/demo mode.

`frontend/src/components/AuthModal.tsx`

- Login/signup modal.
- Uses `AuthContext`.

`frontend/src/components/GatedPage.tsx`

- Protects pages that require a signed-in user.

### Backend

`backend/app/routers/auth.py`

- `POST /api/auth/signup`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `DELETE /api/auth/account`

`backend/app/core/auth.py`

- Request actor extraction.
- Auth dependencies.
- Session/cookie verification.

`backend/app/core/security.py`

- Password hashing and verification.
- Uses Argon2.

`backend/app/core/rate_limit.py`

- Login/security rate limiting helper.

## 6. Backend App Structure

### `backend/app/main.py`

Creates the FastAPI app:

- Adds CORS.
- Adds security headers middleware.
- Mounts `/media/uploads`.
- Includes routers:
  - auth
  - circles/travel groups
  - mapping
  - telemetry

### `backend/app/core/config.py`

Central settings from environment variables:

- `APP_ENV`
- `API_CORS_ORIGINS`
- `OSRM_URL`
- `NOMINATIM_URL`
- `PHOTON_URL`
- `REGION_HINT`
- `REQUIRE_AUTH`
- `AUTH_SECRET`
- `AUTH_COOKIE_NAME`
- `AUTH_TOKEN_TTL_S`
- `TRAVELPLACES_DB_PATH`
- `REDIS_URL`

Frontend env variables include:

- `VITE_API_BASE_URL`
- `VITE_API_PROXY_TARGET`
- `VITE_MAPTILER_KEY`
- `VITE_CESIUM_ION_TOKEN`

Do not hardcode production secrets in source. Tokens in `.env.example` should be treated as sample/local only and should be rotated if ever exposed publicly.

## 7. Database and Persistence

### `backend/app/core/database.py`

SQLite database layer and schema initializer. Current database path defaults to:

```text
backend/data/TravelPlaces.db
```

Main tables:

- `users`
- `user_maps`
- `pins`
- `routes`
- `tracking_sessions`
- `meetup_requests`
- `travel_groups`
- `travel_group_members`
- `circle_invites`
- `saved_places`
- `tracked_devices`
- `member_locations`
- `circle_events`
- `notification_preferences`
- `travel_collections`
- `saved_tourist_spots`
- `audit_log`
- `schema_migrations`

Purpose:

- Initializes schema.
- Preserves/loads legacy state.
- Migrates JSON-style state into relational tables.
- Stores auth users, maps, pins/travel posts, routes, groups, locations, notifications, tourist collections, and audit log records.

### `backend/app/core/map_store.py`

Main persistence facade used by routers. It connects application actions to `database.py`.

Important methods:

- Maps: `list_maps`, `get_map`, `create_map`, `ensure_default_map`.
- Pins/travel posts: `list_pins`, `create_pin`.
- Routes: `list_routes`, `create_route`.
- Tracking: `create_tracking_session`, `get_tracking_session`, `update_tracking_location`.
- Travel groups/circles: `list_circles`, `create_circle`, `update_circle`, invite and member helpers.
- Saved places/devices: `list_saved_places`, `create_saved_place`, `list_tracked_devices`, `create_tracked_device`.
- Location sharing: `update_member_location`, `list_member_locations`.
- Notifications: `list_circle_events`, `delete_circle_event`, notification preference methods.
- Tourist spots: `list_tourist_collections`, `create_tourist_collection`, `delete_tourist_collection`, `list_saved_tourist_spots`, `create_saved_tourist_spot`, `delete_saved_tourist_spot`.
- Account deletion cleanup: `delete_user_data`.
- Smart meetup persistence: `create_meetup_request`.

## 8. Backend Routers and API Responsibilities

### `backend/app/routers/mapping.py`

Base prefix: `/api`

Main responsibilities:

- Search/autocomplete/reverse geocoding.
- Driving routes.
- User maps.
- Pins and travel posts.
- Saved route listing.
- Smart meetup planner.

Important endpoints:

```text
GET  /api/health
GET  /api/search
GET  /api/autocomplete
GET  /api/reverse
POST /api/route
POST /api/routes
POST /api/routes/driving
GET  /api/maps
POST /api/maps
GET  /api/maps/default
GET  /api/pins
POST /api/pins
GET  /api/routes
POST /api/meetups/suggest
```

### `backend/app/routers/circles.py`

Base prefix: `/api/travel-groups`

Despite the router name, this represents travel groups/circles.

Main responsibilities:

- Create/join/update travel groups.
- Invite code creation.
- Member role/admin management.
- Saved frequent places.
- Tracked devices/items.
- Live location sharing and check-ins.
- Travel notifications and notification preferences.
- Tourist collections and saved tourist spots.

Important endpoints:

```text
GET    /api/travel-groups
POST   /api/travel-groups
POST   /api/travel-groups/join
PATCH  /api/travel-groups/{circle_id}
POST   /api/travel-groups/{circle_id}/invite
PATCH  /api/travel-groups/{circle_id}/members/{member_id}
DELETE /api/travel-groups/{circle_id}/members/{member_id}
GET    /api/travel-groups/{circle_id}/locations
POST   /api/travel-groups/{circle_id}/locations
POST   /api/travel-groups/{circle_id}/check-in
GET    /api/travel-groups/{circle_id}/events
PATCH  /api/travel-groups/{circle_id}/events/{event_id}/read
DELETE /api/travel-groups/{circle_id}/events/{event_id}
GET    /api/travel-groups/tourist-collections
POST   /api/travel-groups/tourist-collections
GET    /api/travel-groups/tourist-spots
POST   /api/travel-groups/tourist-spots
DELETE /api/travel-groups/tourist-spots/{place_id}
```

### `backend/app/routers/telemetry.py`

Real-time tracking session and WebSocket support:

```text
POST /api/tracking/sessions
POST /api/tracking/token
WS   /ws/{session_id}
```

### `backend/app/models/*.py`

Pydantic request/response contracts:

- `auth.py`: login, signup, user response.
- `mapping.py`: maps, pins, routes, geocoding, meetup, travel group location contracts.
- `circles.py`: travel groups, saved places, devices, notifications, tourist spots, account deletion models.
- `telemetry.py`: tracking sessions, tracking tokens, WebSocket telemetry events.

## 9. Geospatial Services

### `backend/app/core/mapping.py`

Core GIS and routing logic:

- `Coordinate`, `Location`, `Route`, route steps.
- `LocationParser`: direct coordinate parsing and query normalization.
- `GeocodingService`: Photon/Nominatim-backed search, autocomplete, reverse geocoding with Southeast Asia region hint.
- `RoutingService`: OSRM route building and road snapping fallback.
- `GraphPathfinder` and `GraphRoutingService`: local graph pathfinding fallback with Dijkstra/A*.
- `ETAService`: route progress and ETA calculations.
- `GeofenceService`: GeoJSON geofence validation.
- `TrackingService` and `WebSocketHub`: real-time location events.

### `backend/app/core/meetup_planner.py`

Smart Meetup Planner logic:

- Builds fair/convenient meetup regions.
- Uses isochrone-like polygons and fallbacks.
- Scores venue suggestions by participant route fairness.
- Returns `fair_region.geometry`, `midpoint`, `suggestions`, participant routes, and scoring details.

### `backend/app/core/sea_region.py`

Southeast Asia bounds/constants.

## 10. Frontend Service Layer

### `frontend/src/services/authApi.ts`

Frontend auth API client:

- signup
- login
- logout
- fetch current user

### `frontend/src/services/mappingApi.ts`

Primary frontend API client for map and travel data:

- `searchLocations`
- `autocompleteLocations`
- `reverseLocation`
- `buildDrivingRoute`
- map CRUD/list helpers
- pin/travel post creation and listing
- travel group location sharing
- saved tourist spots and collections
- smart meetup planner request

This file defines most frontend API types used by `MapsWorkspacePage`, `SmartMeetupPlanner`, `SavedTouristSpotsPage`, and `TravelGroupsPage`.

### `frontend/src/services/eventsApi.ts`

Event/meetup API client used by the events page and tour meetup form.

## 11. Main Maps Workspace

### `frontend/src/pages/MapsWorkspacePage.tsx`

This is the main map-centric application workspace. It is the most important frontend file for mapping features.

Main responsibilities:

- Creates and manages the MapLibre map.
- Loads MapTiler Street/Satellite/Terrain styles.
- Switches to Cesium 3D Globe mode without leaving `/maps`.
- Loads user/default map, pins, routes, tourist spots, travel groups, and live group locations.
- Supports private/group/public map scope.
- Shows the bottom-center TravelTraces toolbar.
- Shows the bottom-left Google Maps-style layer selector.
- Controls Path Finder, Draw Route, Live Travel Sharing, Smart Meetup Planner, Travel Markers, Saved Tourist Spots, and Export Map.
- Renders route GeoJSON, point markers, travel post pins, tourist spots, and smart meetup convenient area outline.
- Opens `MarkerFormModal` when placing travel post markers.
- Persists markers/travel posts through `createPin`.
- Uses `workspaceSync` for same-tab/local event broadcasting.

Important map state:

- `baseLayer`: `"street" | "satellite" | "terrain" | "globe"`.
- `scope`: `"private" | "group" | "public"`.
- `fromLocation`, `toLocation`, `draftStops`, `route`.
- `pickTarget`: `"from" | "to" | "marker" | null`.
- `drawingActive`: draw route mode.
- `boxZoomActive`: QGIS-style rectangle zoom mode.
- `meetupPlan`: current Smart Meetup result; rendered as outline-only area.

Recent map UI behavior:

- Custom website cursor is mounted globally via `CustomCursor`.
- Native cursor is hidden only on desktop/fine-pointer devices.
- Map Tools menu contains Pan, Zoom In Box, Zoom Out, Export Map.
- Street/Satellite/Terrain/3D Globe layer switching is handled by `MapLayerSelector`.
- Unsupported Traffic/Transit/Biking tiles are visible but disabled/marked “Soon”.
- Draw Route precision mode uses crosshair and disables accidental map panning while choosing points.
- Zoom In Box uses a rectangle outline only, then calls `fitBounds`.
- Smart Meetup fair region is rendered as a line layer only, not filled.

## 12. Map Components

### `frontend/src/components/TravelTracesToolbar.tsx`

Bottom-center floating toolbar. Organizes workspace tools into:

- Map Tools
- Travel Tools
- Map Mode

It opens one panel at a time and closes panels on outside click.

### `frontend/src/components/maps/MapLayerSelector.tsx`

Bottom-left Google Maps-style layer selector.

Supported real layer switches:

- Satellite
- Terrain
- Street/Default under More
- 3D Globe under More

Disabled visual-only-but-safe options:

- Traffic
- Transit
- Biking

### `frontend/src/components/maps/CesiumGlobeView.tsx`

3D globe layer powered by Cesium Ion. It uses `VITE_CESIUM_ION_TOKEN`, not a hardcoded source value. It receives pins/routes/points from `MapsWorkspacePage` so 3D mode remains part of the same workspace.

### `frontend/src/components/maps/LayerMapInterface.tsx`

Older/companion Leaflet-style map interface. Keep it unless fully replaced; other pages or legacy flows may still rely on it.

### `frontend/src/components/CustomCursor.tsx`

Global animated TravelPlaces cursor:

- Uses `motion/react`.
- Disabled on touch/coarse pointer devices.
- Hides native cursor globally on desktop.
- Handles link/button/text/card/grab/zoom/scroll/click states.

## 13. Travel Posts and Markers

### Frontend files

- `frontend/src/pages/MapsWorkspacePage.tsx`
- `frontend/src/components/MarkerFormModal.tsx`
- `frontend/src/components/MarkerDetailPanel.tsx`
- `frontend/src/utils/photoPinHelpers.ts`
- `frontend/src/services/mappingApi.ts`

Flow:

```text
User opens Travel Tools -> Travel Markers
  -> clicks Drop Marker
  -> map enters marker placement mode
  -> user clicks map
  -> frontend reverse-geocodes location
  -> MarkerFormModal opens
  -> user enters title, note, and photos
  -> save creates FormData/safe payload
  -> POST /api/pins
  -> backend validates scope, media, and ownership
  -> backend stores pin/post/photo metadata
  -> marker appears on map
  -> marker reloads from database on refresh
```

### Backend files

- `backend/app/routers/mapping.py`
- `backend/app/models/mapping.py`
- `backend/app/core/map_store.py`
- `backend/app/core/media_store.py`
- `backend/app/core/database.py`

Important note: pins can be travel posts. Do not treat all pins as simple coordinate markers.

## 14. Path Finder and Draw Route

### Frontend

`MapsWorkspacePage.tsx`

Path Finder supports:

- From input.
- To input.
- Autocomplete suggestions.
- Map point picking for From/To.
- Shortest/Fastest modes.
- Snapped route generation through backend OSRM/fallback routing.

Draw Route supports:

- Draw button.
- Clear button.
- Color picker.
- Path width slider.
- Crosshair point selection.
- Builds routes through `buildDrivingRoute` using selected stops.

### Backend

`backend/app/routers/mapping.py`

- Receives route requests.

`backend/app/core/mapping.py`

- Resolves geocoding.
- Builds routes through OSRM or fallback graph route.

## 15. Smart Meetup Planner

### Frontend

`frontend/src/components/SmartMeetupPlanner.tsx`

Supports:

- Add Friend.
- Add Follower.
- Add manual participant.
- Participant address search.
- Partial/fuzzy local suggestions.
- Backend autocomplete merging.
- Travel limit slider.
- Generate Meetup.
- Generate Another.
- Venue suggestion cards.
- Sends current plan back to `MapsWorkspacePage` through `onPlanChange`.

`MapsWorkspacePage.tsx` renders the convenient/fair meetup region as an outline-only MapLibre line source/layer.

### Backend

`backend/app/core/meetup_planner.py`

- Computes fair meetup area and suggestions.

`backend/app/routers/mapping.py`

- Exposes planner endpoint.

## 16. Location Sharing and Travel Groups

### Frontend

`MapsWorkspacePage.tsx`

Live Travel Sharing panel supports:

- Travel group dropdown.
- Visibility dropdown.
- Share.
- Stop.
- Check In.
- Status display.

`frontend/src/pages/TravelGroupsPage.tsx`

Travel group/circle management UI:

- Create/join groups.
- Invite codes.
- Members.
- Saved places/devices.
- Notifications and preferences.

### Backend

`backend/app/routers/circles.py`

- Travel groups/circles, members, invites, locations, check-ins, events, preferences.

`backend/app/core/map_store.py`

- Persists location sharing state and notifications.

## 17. Saved Tourist Spots

### Frontend

`frontend/src/pages/SavedTouristSpotsPage.tsx`

Supports:

- Create collections.
- Save tourist spots.
- Search saved places.
- Filter by category.
- Delete saved spots.

`MapsWorkspacePage.tsx`

Uses saved tourist spots inside the map workspace:

- Count/list.
- Fly to spot.
- Use as From.
- Use as To.
- Create post from spot.

### Backend

`backend/app/routers/circles.py`

- Tourist collection and saved tourist spot endpoints.

`backend/app/core/database.py`

- `travel_collections`
- `saved_tourist_spots`

## 18. Georeferenced Photos

### `frontend/src/pages/GeoreferencedPhotosPage.tsx`

Companion page for travel photos:

- Upload photo.
- Parse EXIF GPS metadata using frontend libraries.
- If missing, allow manual map coordinate selection.
- Publish geotagged photos to map workspace as markers/posts.
- Capture georeferenced photo with camera/geolocation where browser permissions allow.

Related:

- `frontend/src/components/MapCustomForm.tsx`
- `frontend/src/utils/photoPinHelpers.ts`
- `frontend/src/services/mappingApi.ts`

## 19. Events and Host Tour Meetup

### `frontend/src/pages/EventsPage.tsx`

Travel events page.

### `frontend/src/components/HostTourMeetupForm.tsx`

Modal form for scheduling a tour meetup. Fields include:

- Meetup Expedition Title.
- Target Destination.
- Date.
- Meeting Time.
- Ticketed/Paid Tour.
- Price when ticketed.
- Meetup Rendezvous/Meeting Point.
- DOT Tour Guide License Number.
- Schedule and Tour Details.

Uses existing user/auth context and event API flow.

### `frontend/src/services/eventsApi.ts`

Event service functions used by event-related UI.

## 20. Explore, Stories, Community, Profile

### `frontend/src/pages/ExplorePage.tsx`

Destination discovery page:

- Destination cards.
- Category filter bar.
- Result count.
- Modal with destination detail.

### `frontend/src/pages/StoriesPage.tsx`

Travel stories page and story modal.

### `frontend/src/pages/CommunityPage.tsx`

Community/social discovery page.

### `frontend/src/pages/ProfilePage.tsx`

User profile page. Uses auth context/demo profile fields.

## 21. Chat UI

### `frontend/src/components/ChatPanel.tsx`

Updated dark navy chat panel:

- Search.
- Tabs: Friends, Events, Unread.
- Conversation list.
- Active thread view.
- Message bubbles and input.
- Existing mock/stable chat behavior unless real chat backend is added later.

### `frontend/src/components/Navbar.tsx`

Owns chat launcher/open-close behavior and global navigation.

## 22. UI and Styling

### `frontend/src/index.css`

Global CSS and Tailwind setup.

### `frontend/src/styles/index.css`

Additional shared styles.

### `frontend/src/components/workspace/*`

Reusable workspace UI primitives:

- `WorkspaceButton.tsx`
- `WorkspaceToggleGroup.tsx`
- `WorkspaceSection.tsx`
- `workspaceStyles.ts`

Design palette:

- Navy: `#12212E`
- Cream: `#ECE7DC` / `#F5F0E8`
- Teal: `#6CA3A2` / `#307082`
- Orange: `#EA9940`
- Deep green legacy token: `#2D4A2D`

## 23. Security Notes

Current security mechanisms:

- Argon2 password hashing.
- Auth cookies/JWT-style sessions.
- Rate limiting for login/security flows.
- Security headers middleware.
- Input validation through Pydantic models.
- Backend-managed media uploads.
- Upload type/size validation should remain enforced for all image endpoints.
- Map scopes must be enforced for private/group/public data.
- Group access checks must protect group maps/posts/locations.
- Permanent account deletion flows through backend cleanup methods.

Important rules for future AI/developer work:

- Do not expose password hashes or auth tokens.
- Do not store raw local file paths in the database.
- Do not hardcode production API keys or Cesium tokens in source.
- Do not add frontend-only fake data paths where a backend/database flow already exists.
- Preserve ownership and visibility checks when adding reads/updates/deletes.

## 24. Current Feature Progress Summary

Implemented or substantially integrated:

- Authentication frontend/backend with local fallback behavior.
- SQLite-backed persistence layer and schema.
- User maps, private/group/public map scopes.
- MapLibre workspace with MapTiler Street/Satellite/Terrain.
- Cesium 3D Globe mode via env token.
- Bottom-center TravelTraces toolbar.
- Bottom-left layer selector.
- Custom animated desktop cursor.
- Path Finder with autocomplete and point picking.
- Draw Route with snapped route generation.
- QGIS-style box zoom and zoom out map tools.
- Travel marker/travel post modal with photo support.
- Saved marker reload from backend/database.
- Live Travel Sharing controls and group location APIs.
- Smart Meetup Planner with fuzzy suggestions and fair-region map outline.
- Saved Tourist Spots and collections.
- Travel Groups/Circles management.
- Travel notifications/preferences.
- Georeferenced photos page.
- Host Tour Meetup form.
- Updated Chat panel UI.
- Account deletion route/page/backend support.

Known caveats:

- Some UI/pages still contain demo/stable fallback data for local experience.
- `backend/data/map_state.json` remains as legacy/migration-compatible state.
- `.git` directory in the current workspace appears invalid or incomplete; `git status` failed locally even though a `.git` folder exists.
- Traffic/Transit/Biking layer selector buttons are intentionally disabled/marked “Soon” because no working provider/API is configured.
- Production deployment should rotate any token that has appeared in examples or local `.env.example` files.

## 25. Development Commands

Frontend:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
```

Backend:

```powershell
cd backend
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Local frontend dev server defaults to:

```text
http://127.0.0.1:3000
```

Backend defaults to:

```text
http://localhost:8000
```

## 26. Recommended AI Starting Points

For map work:

1. Read `frontend/src/pages/MapsWorkspacePage.tsx`.
2. Read `frontend/src/services/mappingApi.ts`.
3. Read `backend/app/routers/mapping.py`.
4. Read `backend/app/core/map_store.py`.
5. Read `backend/app/core/mapping.py`.

For database work:

1. Read `backend/app/core/database.py`.
2. Read `backend/app/core/map_store.py`.
3. Read `backend/app/models/*.py`.
4. Read router files under `backend/app/routers/`.

For auth/security:

1. Read `frontend/src/context/AuthContext.tsx`.
2. Read `frontend/src/services/authApi.ts`.
3. Read `backend/app/routers/auth.py`.
4. Read `backend/app/core/auth.py`.
5. Read `backend/app/core/security.py`.

For UI/design:

1. Read `frontend/src/App.tsx`.
2. Read `frontend/src/components/Navbar.tsx`.
3. Read `frontend/src/components/TravelTracesToolbar.tsx`.
4. Read `frontend/src/components/workspace/*`.
5. Read the target page/component.

## 27. Dependency Flow Examples

### Create Travel Post Marker

```text
MapsWorkspacePage
  -> MarkerFormModal
  -> photoPinHelpers
  -> mappingApi.createPin
  -> POST /api/pins
  -> backend routers/mapping.py
  -> map_store.create_pin
  -> database pins table
  -> media_store for uploaded files
  -> map reload/listPins
  -> MapLibre pin source/layers
```

### Generate Route

```text
MapsWorkspacePage
  -> mappingApi.buildDrivingRoute
  -> POST /api/routes/driving
  -> routers/mapping.py
  -> GeocodingService resolves text endpoints if needed
  -> RoutingService OSRM/fallback route
  -> map_store.create_route if persist=true
  -> database routes table
  -> MapLibre route source/layer
```

### Smart Meetup

```text
SmartMeetupPlanner
  -> local fuzzy suggestions + mappingApi.autocompleteLocations
  -> mappingApi.suggestMeetup
  -> POST /api/meetups/suggest
  -> routers/mapping.py
  -> meetup_planner.py fair region + suggestions
  -> map_store.create_meetup_request if persist=true
  -> SmartMeetupPlanner cards
  -> MapsWorkspacePage meetupAreaData
  -> MapLibre outline-only area layer
```

### Live Travel Sharing

```text
MapsWorkspacePage
  -> mappingApi.updateTravelGroupLocation/checkInTravelGroup
  -> routers/circles.py
  -> map_store.update_member_location
  -> database member_locations and circle_events
  -> listTravelGroupLocations/listTravelNotifications
  -> map/UI status
```

### Account Deletion

```text
AccountDeletionPage
  -> authApi/account delete call
  -> DELETE /api/auth/account
  -> routers/auth.py
  -> password confirmation/reauth validation
  -> map_store.delete_user_data
  -> database.delete_user
  -> auth cookie/session termination
```

## 28. What Not To Break

When editing the project, preserve:

- Login/signup/logout.
- Auth modal and gated pages.
- `/maps` workspace and MapLibre rendering.
- Street/Satellite/Terrain/3D Globe switching.
- TravelTracesToolbar and MapLayerSelector.
- Path Finder autocomplete and point picking.
- Draw Route snapping and route styling.
- Smart Meetup Planner participant flow and fair-region rendering.
- Travel Marker/Travel Post modal and photo uploads.
- Private/group/public visibility scopes.
- Saved Tourist Spots and collections.
- Travel Groups and location sharing.
- Georeferenced Photos page.
- Account deletion cleanup.
- Build passing with `npm.cmd run build` and `npm.cmd run lint`.
