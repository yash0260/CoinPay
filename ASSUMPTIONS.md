# Assumptions

Product and design decisions made where the brief was intentionally vague.

## 1. Single User App
The brief doesn't mention authentication or multi-user support. I built a single-user app with a hardcoded `USER001`. In a real product, this would be behind auth, but for this scope it simplifies the data model without losing any of the interesting engineering.

## 2. Coin Earning Rules
- **"One coin per ₹100 spent"** — I interpret this as `floor(amount / 100)`, so ₹350 earns 3 coins, ₹99 earns 0.
- **"Capped per transaction"** — The brief says capped but doesn't specify the cap. I chose **50 coins per transaction** (effectively ₹5,000 max earning per transaction). This prevents the ~21 outlier transactions (amounts up to ₹999M) from absurdly inflating the balance.
- **Only SUCCESS transactions** with positive amounts earn coins. FAILED and PENDING do not. Refunds (negative amounts) do not earn coins.

## 3. Negative Amounts = Refunds
148 transactions have negative amounts. I treat these as refunds or cashbacks. They appear normally in the table and analytics, but are excluded from the coin earning calculation since you wouldn't earn rewards on a refund.

## 4. Outlier Amounts
21 transactions have amounts exceeding ₹1,000,000 (max ₹999,999,999). These look like intentional test data to see if the app handles edge cases. I display them normally with proper formatting (₹99.9Cr compact notation) and cap their coin contribution via the per-transaction cap.

## 5. "Uncategorized" for Missing Categories
200 records have null or empty `category` fields. Rather than dropping them or guessing, I label them "Uncategorized" — the most honest approach. They show up in charts and filters under this label.

## 6. Duplicate Transaction IDs
40 pairs of duplicate `txn_id` values exist in the dataset. I use an auto-incrementing integer primary key so all records are preserved. The `txn_id` field is kept as a reference but is not unique. This is likely intentional dirty data.

## 7. Rewards Catalogue
The brief says "four to six rewards that you define." I created 5:
1. ₹100 Amazon Voucher (50 coins)
2. ₹250 Swiggy Voucher (120 coins)
3. ₹500 Flipkart Voucher (240 coins)
4. 1% Cashback Coupon (100 coins)
5. Premium Lounge Pass (500 coins)

Pricing is set so the cheapest reward is accessible early, and the most expensive is aspirational. These are all realistic rewards for an Indian credit card product.

## 8. Server-Side Pagination (not Virtualization)
I chose server-side pagination over client-side virtualization. The brief says "be ready to explain why you picked one." Pagination with server-side filtering/sorting is the production-appropriate approach for a real dataset that could grow beyond 10k rows. It keeps the client light and pushes heavy work to the database where it belongs.

## 9. Drawer for Transaction Details
The brief says "a drawer or a modal, your call." I chose a slide-in drawer because it preserves the context of the table behind it — the user can still see where they were. Modals block the view, which feels jarring for a detail view.

## 10. Date Range of Data
The dataset spans June 30, 2025 to July 15, 2026 (~12.5 months). Some timestamps are in the future relative to mid-2025, suggesting this is synthetic test data. I display all dates as-is without filtering.
