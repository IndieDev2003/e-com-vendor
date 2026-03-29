Here is a clean, production-quality Markdown file (well-structured, readable, and ready for GitHub/Swagger import):

# 📦 Product API Documentation

## 📍 Base URL

/api/products


---

## 🔐 Authentication & Authorization

| Role   | Access Level |
|--------|-------------|
| Public | Read operations |
| Vendor | Create, Update |
| Admin  | Delete, Analytics, Bulk |

> 🔒 Protected routes require authentication (JWT/Session)

---

## 📦 Standard Response Format

```json
{
  "success": true,
  "message": "Optional message",
  "data": {},
  "pagination": {}
}
🟢 CREATE
➕ Create Product

POST /

Request Body
{
  "name": "Product Name",
  "description": "Optional description",
  "price": 100,
  "category": "Drugs | Weapons | Data",
  "vendor": "vendorId",
  "stock": 50,
  "images": ["url1", "url2"],
  "isActive": true
}
Response
201 Created
➕ Bulk Create Products

POST /bulk

Request Body
{
  "products": [
    { "name": "Product 1", "price": 100, "category": "Data", "vendor": "id" }
  ]
}
🔵 READ
📄 Get All Products

GET /

Query Parameters
Param	Type	Description
category	string	Filter by category
vendor	string	Vendor ID
minPrice	number	Minimum price
maxPrice	number	Maximum price
isActive	boolean	Active status
inStock	boolean	Stock availability
page	number	Page number
limit	number	Items per page
sortBy	string	Field to sort
sortOrder	string	asc or desc
🔍 Search Products

GET /search?q=keyword

📦 Get Product by ID

GET /:id

🏪 Get Products by Vendor

GET /vendor/:vendorId

🏷️ Get Products by Category

GET /category/:category

⚠️ Get Low Stock Products

GET /inventory/low-stock

Query
threshold=10
❌ Get Out-of-Stock Products

GET /inventory/out-of-stock

🟡 UPDATE
✏️ Update Product

PUT /:id

Request Body
{
  "name": "Updated Name",
  "price": 200,
  "category": "Data"
}
📦 Update Stock

PATCH /:id/stock

Request Body
{
  "quantity": 10,
  "operation": "add | subtract | set"
}
💰 Update Price

PATCH /:id/price

Request Body
{
  "price": 150
}
🔁 Toggle Product Status

PATCH /:id/toggle-status

🖼️ Add Product Image

POST /:id/images

{
  "imageUrl": "https://example.com/image.jpg"
}
🗑️ Remove Product Image

DELETE /:id/images

{
  "imageUrl": "https://example.com/image.jpg"
}
🔴 DELETE
❌ Delete Product (Hard Delete)

DELETE /:id

📴 Soft Delete Product

DELETE /:id/soft

Sets isActive = false

🧹 Delete Products by Vendor

DELETE /vendor/:vendorId

📊 ANALYTICS
📈 Get Product Statistics

GET /analytics/stats

Response Example
{
  "totalProducts": 100,
  "activeProducts": 80,
  "inactiveProducts": 20,
  "outOfStock": 10,
  "lowStock": 15,
  "totalInventoryValue": 50000,
  "categoryBreakdown": []
}
💎 Top Products by Price

GET /analytics/top-by-price

Query
limit=10
📦 Products with Most Stock

GET /analytics/most-stock

📊 Average Price by Category

GET /analytics/avg-price-by-category

⚡ BULK OPERATIONS
💰 Bulk Update Prices by Category

PATCH /bulk/update-prices

Request Body
{
  "category": "Data",
  "priceChange": 10,
  "operation": "increase | decrease | multiply"
}
📴 Bulk Deactivate Products

PATCH /bulk/deactivate

Request Body
{
  "productIds": ["id1", "id2"]
}
❗ Error Handling
🔴 400 Bad Request
{
  "success": false,
  "message": "Invalid input"
}
🔴 404 Not Found
{
  "success": false,
  "message": "Product not found"
}
🔴 500 Internal Server Error
{
  "success": false,
  "message": "Internal server error"
}
🧠 Important Notes
All IDs must be valid MongoDB ObjectIds
Prices must be non-negative
Stock cannot go below 0
Soft delete disables product visibility
Pagination is included in list endpoints