# AI Usage

## Tools Used

- **Claude (Anthropic)** — Used extensively for code generation, architecture decisions, and debugging throughout the project.
- **Antigravity IDE (Gemini-powered)** — AI-powered IDE assistant used as the primary development environment.

## How AI Was Used

1. **Architecture planning** — Used Claude to discuss the schema design, API structure, and component hierarchy before writing code.
2. **Code generation** — Generated boilerplate for FastAPI routes, SQLAlchemy models, Pydantic schemas, and React components.
3. **Data analysis** — Used AI to help analyze the 10k transaction dataset and identify the 7 data quality quirks (mixed timestamps, null categories, negative amounts, string amounts, duplicate IDs, outlier amounts, timezone offsets).
4. **CSS design system** — Generated the initial design token system and component CSS.
5. **Debugging** — Used AI to diagnose issues with timestamp parsing and cross-filtering state management.

## AI Output I Discarded or Fixed

### Example 1: Timestamp Parsing (Discarded AI approach)

AI initially suggested using a simple `new Date(timestamp)` approach in JavaScript for parsing timestamps. This failed because:
- Epoch milliseconds (`1768265109000`) were treated as a year number, not milliseconds
- Date-only strings (`"2025-07-03"`) were parsed as UTC midnight, causing timezone issues when displayed
- The `+05:30` offset timestamps needed explicit handling

**Fix**: Wrote a custom `parse_timestamp()` function in the seed script that explicitly detects the format (isinstance check for int/float, regex for date-only, fromisoformat for ISO strings) and normalizes everything to timezone-aware UTC datetimes before inserting into PostgreSQL. The parsing logic lives server-side where it belongs, not in the browser.

### Example 2: Coin Balance Calculation (Fixed AI logic)

AI initially calculated coin balance as:
```python
total_coins = sum(floor(txn.amount / 100) for txn in successful_transactions)
```

This was wrong for two reasons:
1. **No per-transaction cap** — With outlier amounts (up to ₹999,999,999), one transaction would generate 9,999,999 coins, making the balance absurdly large and making the rewards system meaningless
2. **Included negative amounts** — Refunds (negative amounts) would subtract coins, which doesn't make business sense. You don't "un-earn" coins when you get a refund.

**Fix**: Added `MAX_COINS_PER_TRANSACTION = 50` cap and filtered to only `amount > 0` transactions. The corrected logic:
```python
coins = min(floor(amount / 100), MAX_COINS_PER_TRANSACTION)
# Only for SUCCESS status and positive amounts
```

### Example 3: Table Scroll CSS (Fixed)

AI generated a table that used `overflow: auto` on the table itself. This broke the sticky header because `overflow` creates a new stacking context. 

**Fix**: Separated the scroll container (`overflow-x: auto` on a wrapper div) from the table element, and applied `position: sticky; top: 0` to `thead` with a proper `z-index`. The sticky header now works correctly within the scrollable container.
