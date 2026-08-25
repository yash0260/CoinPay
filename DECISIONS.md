# Technical Decisions

Key technical choices and the reasoning behind them.

## 1. Server-Side Pagination + Filtering + Sorting

**Decision**: All 10k transactions stay in PostgreSQL. The frontend requests pages of 20–100 rows at a time with filter/sort parameters.

**Why**: This is the production pattern. Client-side virtualization (e.g., react-window) works fine at 10k but breaks at 100k or 1M. Server-side pagination:
- Keeps the client payload small (~2KB per page vs ~2.5MB for all 10k)
- Pushes filtering and sorting to PostgreSQL, which has proper indexes
- Scales naturally if the dataset grows
- Reduces initial load time

**Trade-off**: More API round-trips and slightly more latency on filter changes vs instant client-side filtering.

## 2. Hand-Built Table (No Component Library)

**Decision**: The entire transaction table is custom CSS + React. No MUI DataGrid, no Ant Table, no Tanstack Table.

**Why**: Per the brief's constraint, this is the primary place to demonstrate CSS mastery. The table features:
- Sticky header (position: sticky)
- Hover and focus-visible states
- Sort direction indicators
- Skeleton loading animation
- Empty and error states
- Responsive breakpoints (hides columns progressively at 768px and 480px)
- Keyboard navigation (Tab through rows, Enter/Space to open detail)
- Tabular number formatting for amounts

## 3. CSS Design Tokens (Custom Properties)

**Decision**: All colors, spacing, typography, radii, and shadows are CSS custom properties in `tokens.css`. Components reference tokens, never hardcoded values.

**Why**: This is the foundation of a scalable design system:
- Single source of truth for visual language
- Theme switching (dark/light) becomes trivial
- Consistent spacing and sizing across all components
- Easy to onboard new developers

## 4. State Management: Custom Hooks (No Redux/Zustand)

**Decision**: State is managed with React hooks (`useState`, `useEffect`, `useCallback`) wrapped in custom hooks (`useTransactions`, `useRewards`, `useAnalytics`).

**Why**: For this scope, custom hooks provide:
- Co-located data fetching and state
- Clear, composable interfaces
- No additional dependencies
- Easy to test in isolation

If the app grew to 20+ pages with shared state, I'd introduce Zustand or React Context.

## 5. FastAPI Over Flask

**Decision**: FastAPI for the Python backend.

**Why**:
- Automatic request/response validation via Pydantic
- Built-in OpenAPI docs (visit `/docs` for interactive API explorer)
- Async support for future scalability
- Type hints align with TypeScript frontend typing philosophy

## 6. Schema Design: Separate Tables, Auto-Increment PK

**Decision**: Four tables: `transactions`, `user_balance`, `rewards_catalogue`, `redemption_history`. Transactions use auto-increment `id` as PK, with `txn_id` as a non-unique reference.

**Why**:
- The dataset has ~40 duplicate `txn_id` values, so using it as PK would lose data
- Auto-increment PK is simpler and faster for joins/indexes
- Separate `user_balance` table (not computed on-the-fly) for performance — balance is pre-computed at seed time and updated atomically on redemption
- `redemption_history` provides an audit trail

## 7. Pessimistic Locking on Redemption

**Decision**: The `redeem_reward` function uses `SELECT ... FOR UPDATE` (SQLAlchemy `with_for_update()`) to lock the balance row during redemption.

**Why**: Prevents a race condition where two concurrent redeems could both read the same balance, both pass the check, and both deduct — resulting in a negative balance. The lock ensures serial access.

## 8. Optimistic UI Update with Rollback

**Decision**: When the user clicks "Confirm Redeem", the frontend immediately deducts coins from the displayed balance before the API responds. If the API fails, it rolls back to the previous balance.

**Why**: This makes the UI feel instant and responsive. The 200–500ms API round-trip would otherwise show a jarring delay between clicking and seeing the balance change.

## 9. Recharts for Charting

**Decision**: Used Recharts library for the pie and bar charts.

**Why**: The brief explicitly permits charting libraries. Recharts is:
- React-native (no DOM manipulation)
- Lightweight (~45KB gzipped)
- Good TypeScript support
- Easy to customize with CSS variables
- Supports click handlers for chart-to-table filtering

## 10. Two-Way Cross-Filtering

**Decision**: Clicking a pie chart slice filters the table AND updating table filters reshapes the charts.

**Why**: The brief marks this as a "bonus" feature. I implemented it because:
- It creates a more cohesive analytical experience
- The architecture already supports it (analytics endpoints accept filter params)
- It demonstrates data flow mastery
