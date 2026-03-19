# API Filter Parameters Configuration Guide

## Endpoint: GET `/buyer/bid/buyer/{buyerId}`

### Current Parameters (Already Supported)
- `page` (number) - Page number for pagination
- `limit` (number) - Number of items per page
- `status` (string, optional) - Filter by bid status

### New Filter Parameters (To Be Implemented)

The following query parameters need to be added to the backend API endpoint:

#### 1. **Category Filter**
- **Parameter**: `category`
- **Type**: `string`
- **Values**: `"electronics"`, `"machinery"`, `"equipment"`, `"scrap"`, `"other"`, or any category from your database
- **Description**: Filter bids by product category
- **Example**: `?category=electronics`

#### 2. **Search Filter**
- **Parameter**: `search`
- **Type**: `string`
- **Description**: Search bids by product title/name (case-insensitive partial match)
- **Example**: `?search=laptop`

#### 3. **Minimum Bid Amount**
- **Parameter**: `min_amount`
- **Type**: `number` or `string` (decimal)
- **Description**: Filter bids with bid amount greater than or equal to this value
- **Example**: `?min_amount=1000.00`

#### 4. **Maximum Bid Amount**
- **Parameter**: `max_amount`
- **Type**: `number` or `string` (decimal)
- **Description**: Filter bids with bid amount less than or equal to this value
- **Example**: `?max_amount=5000.00`

#### 5. **Date From**
- **Parameter**: `date_from`
- **Type**: `string` (ISO 8601 date format: `YYYY-MM-DD`)
- **Description**: Filter bids created on or after this date
- **Example**: `?date_from=2024-01-01`

#### 6. **Date To**
- **Parameter**: `date_to`
- **Type**: `string` (ISO 8601 date format: `YYYY-MM-DD`)
- **Description**: Filter bids created on or before this date
- **Example**: `?date_to=2024-12-31`

### Complete Example Request

```
GET /buyer/bid/buyer/517?page=1&limit=10&status=accepted&category=electronics&search=laptop&min_amount=500&max_amount=2000&date_from=2024-01-01&date_to=2024-12-31
```

### Backend Implementation Notes

1. **All parameters are optional** - The API should work with any combination of filters
2. **Multiple filters should be combined with AND logic** - All active filters must match
3. **Date range validation** - Ensure `date_from` <= `date_to` if both are provided
4. **Amount range validation** - Ensure `min_amount` <= `max_amount` if both are provided
5. **Search should be case-insensitive** - Use `ILIKE` (PostgreSQL) or `LOWER()` function
6. **Category matching** - Should match the category field in the products table
7. **Status values** - Should match your existing status enum/values: `pending`, `accepted`, `rejected`, `expired`, `withdrawn`

### Database Query Example (PostgreSQL)

```sql
SELECT * FROM buyer_bids bb
JOIN products p ON bb.product_id = p.id
WHERE bb.buyer_id = $1
  AND ($2::text IS NULL OR bb.status = $2)
  AND ($3::text IS NULL OR p.category = $3)
  AND ($4::text IS NULL OR LOWER(p.title) LIKE '%' || LOWER($4) || '%')
  AND ($5::numeric IS NULL OR bb.bid_amount >= $5)
  AND ($6::numeric IS NULL OR bb.bid_amount <= $6)
  AND ($7::date IS NULL OR DATE(bb.bid_date) >= $7)
  AND ($8::date IS NULL OR DATE(bb.bid_date) <= $8)
ORDER BY bb.bid_date DESC
LIMIT $9 OFFSET $10;
```

### Frontend Implementation

The frontend is already configured to send these parameters. The UI includes:
- ✅ Search input field
- ✅ Status dropdown filter
- ✅ Category dropdown filter
- ✅ Min/Max amount inputs
- ✅ Date range pickers (from/to)
- ✅ Filter toggle button with active count badge
- ✅ Clear all filters button

All filters are sent to the API automatically when changed, and pagination resets to page 1 when filters are applied.

