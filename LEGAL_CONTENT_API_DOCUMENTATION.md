# Legal Content Management API Documentation

## Overview

The Legal Content Management module provides APIs to manage legal documents including Terms of Service, Privacy Policy, and Waiver Document. Only admin users can manage these contents.

## Database Schema

### Table: `legal_contents`

| Field     | Type          | Description                      |
| --------- | ------------- | -------------------------------- |
| id        | UUID (PK)     | Auto-generated primary key       |
| title     | STRING(255)   | Title of the document            |
| slug      | STRING(255)   | URL slug (unique)                |
| content   | TEXT          | Full text content                |
| version   | STRING(50)    | Version label (e.g., "v1.0")     |
| status    | ENUM('0','1') | 0 = inactive, 1 = active         |
| isPublish | ENUM('0','1') | 0 = unpublished, 1 = published   |
| createdAt | DATETIME      | Created timestamp                |
| updatedAt | DATETIME      | Updated timestamp                |
| deletedAt | DATETIME      | Soft-delete timestamp (nullable) |

## API Endpoints

### Authentication

All admin endpoints require:

- Valid JWT token in Authorization header
- Admin role verification

### 1. Add Legal Content

**POST** `/api/legal-content/create`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Terms of Service",
  "slug": "terms",
  "content": "This is the terms of service content...",
  "version": "v1.0",
  "status": "1",
  "isPublish": "0"
}
```

**Response (201):**

```json
{
  "message": "Legal content created successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "slug": "terms",
    "content": "This is the terms of service content...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "0",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Validation:**

- All fields (title, slug, content, version) are required
- Slug must be unique
- Status and isPublish must be "0" or "1"

### 2. Edit Legal Content

**POST** `/api/legal-content/edit`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "title": "Updated Terms of Service",
  "content": "Updated content...",
  "version": "v1.1",
  "status": "1",
  "isPublish": "1"
}
```

**Response (200):**

```json
{
  "message": "Legal content updated successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Updated Terms of Service",
    "slug": "terms",
    "content": "Updated content...",
    "version": "v1.1",
    "status": "1",
    "isPublish": "1",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Note:** Slug cannot be edited once created.

### 3. Delete Legal Content (Soft Delete)

**POST** `/api/legal-content/delete`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid"
}
```

**Response (200):**

```json
{
  "message": "Legal content deleted successfully",
  "status": true,
  "data": null
}
```

### 4. View Content Detail

**POST** `/api/legal-content/detail`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid"
}
```

**Response (200):**

```json
{
  "message": "Legal content fetched successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "slug": "terms",
    "content": "Content...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "0",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### 5. List Content

**GET** `/api/legal-content/list`

**Headers:**

```
Authorization: <jwt_token>
```

**Query Parameters:**

- `status` (optional): Filter by status ("0" or "1")
- `isPublish` (optional): Filter by publish status ("0" or "1")
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**

```
GET /api/legal-content/list?status=1&isPublish=1&page=1&limit=5
```

**Response (200):**

```json
{
  "message": "Legal content list fetched successfully",
  "status": true,
  "data": {
    "content": [
      {
        "id": "uuid",
        "title": "Terms of Service",
        "slug": "terms",
        "content": "Content...",
        "version": "v1.0",
        "status": "1",
        "isPublish": "1",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "updatedAt": "2024-12-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 1,
      "totalItems": 1,
      "itemsPerPage": 10
    }
  }
}
```

### 6. Update Status

**POST** `/api/legal-content/status`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "status": "1"
}
```

**Response (200):**

```json
{
  "message": "Legal content status updated to active successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "slug": "terms",
    "content": "Content...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "0",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### 7. Update Publish Status

**POST** `/api/legal-content/publish`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "isPublish": "1"
}
```

**Response (200):**

```json
{
  "message": "Legal content publish status updated to published successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "slug": "terms",
    "content": "Content...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "1",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### 8. Public Content Access (No Authentication Required)

**GET** `/api/legal-content/public/:slug`

**Response (200):**

```json
{
  "message": "Legal content fetched successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Terms of Service",
    "slug": "terms",
    "content": "Content...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "1",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Note:** This endpoint only returns content that is both active (status=1) and published (isPublish=1).

## Error Responses

### 400 Bad Request

```json
{
  "message": "Title, slug, content, and version are required",
  "status": false,
  "data": null
}
```

### 401 Unauthorized

```json
{
  "message": "A token is required for authentication",
  "status": true,
  "data": null
}
```

### 403 Forbidden

```json
{
  "message": "Access denied. Required role: admin",
  "status": false,
  "data": null
}
```

### 404 Not Found

```json
{
  "message": "Legal content not found",
  "status": false,
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "message": "Failed to create legal content",
  "status": false,
  "data": "Error details"
}
```

## Usage Examples

### Creating a new Terms of Service

```bash
curl -X POST http://localhost:3000/api/legal-content/create \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Terms of Service",
    "slug": "terms",
    "content": "By using our service, you agree to...",
    "version": "v1.0",
    "status": "1",
    "isPublish": "0"
  }'
```

### Editing content

```bash
curl -X POST http://localhost:3000/api/legal-content/edit \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "title": "Updated Terms of Service",
    "content": "Updated content...",
    "version": "v1.1",
    "status": "1",
    "isPublish": "1"
  }'
```

### Publishing content

```bash
curl -X POST http://localhost:3000/api/legal-content/publish \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "isPublish": "1"
  }'
```

### Public access to published content

```bash
curl http://localhost:3000/api/legal-content/public/terms
```

## Initial Data

The system comes pre-populated with three legal content types:

1. Terms of Service (slug: "terms")
2. Privacy Policy (slug: "privacy")
3. Waiver Document (slug: "waiver")

All initial content is set to active but unpublished, allowing admins to review and update before publishing.
