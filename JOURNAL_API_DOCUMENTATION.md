# Journal Management API Documentation

## Overview

The Journal Management module provides APIs for users to create, manage, and maintain personal journal entries linked to sessions attended. Journal entries are private to the user and securely stored. They are not visible to practitioners or administrators.

## API Endpoints

### Authentication

All journal endpoints require:

- Valid JWT token in Authorization header
- User role verification (regular users only)

### 1. Create Journal Entry

**POST** `/api/journal/create`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "entryText": "Today's session was very relaxing. I learned new breathing techniques that helped me manage my stress levels.",
  "classId": "uuid" // Optional - link to a specific class/session
}
```

**Response (201):**

```json
{
  "message": "Journal entry created successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "classId": "uuid",
    "entryText": "Today's session was very relaxing. I learned new breathing techniques that helped me manage my stress levels.",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "class": {
      "id": "uuid",
      "title": "Yoga for Beginners",
      "description": "A gentle introduction to yoga"
    }
  }
}
```

**Validation:**

- `entryText` is required
- `classId` is optional but must be valid if provided

### 2. List Journal Entries

**GET** `/api/journal/list`

**Headers:**

```
Authorization: <jwt_token>
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `classId` (optional): Filter by specific class/session

**Example:**

```
GET /api/journal/list?page=1&limit=5&classId=uuid
```

**Response (200):**

```json
{
  "message": "Journal entries retrieved successfully",
  "status": true,
  "data": {
    "entries": [
      {
        "id": "uuid",
        "userId": "uuid",
        "classId": "uuid",
        "entryText": "Today's session was very relaxing. I learned new breathing techniques that helped me manage my stress levels.",
        "createdAt": "2024-12-01T00:00:00.000Z",
        "updatedAt": "2024-12-01T00:00:00.000Z",
        "user": {
          "id": "uuid",
          "first_name": "John",
          "last_name": "Doe",
          "email": "john@example.com"
        },
        "class": {
          "id": "uuid",
          "title": "Yoga for Beginners",
          "description": "A gentle introduction to yoga"
        }
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalEntries": 25,
      "entriesPerPage": 10
    }
  }
}
```

**Security:** Users can only view their own journal entries.

### 3. Get Single Journal Entry

**POST** `/api/journal/detail`

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

**Example:**

```bash
curl -X POST http://localhost:3000/api/journal/detail \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "journal-entry-uuid"
  }'
```

**Response (200):**

```json
{
  "message": "Journal entry retrieved successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "classId": "uuid",
    "entryText": "Today's session was very relaxing. I learned new breathing techniques that helped me manage my stress levels.",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "class": {
      "id": "uuid",
      "title": "Yoga for Beginners",
      "description": "A gentle introduction to yoga"
    }
  }
}
```

**Error Response (404):**

```json
{
  "message": "Journal entry not found or access denied",
  "status": false,
  "data": null
}
```

**Security:** Users can only view their own journal entries.

### 4. Edit Journal Entry

**POST** `/api/journal/edit`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "entryText": "Updated journal entry text with new insights from today's session.",
  "classId": "uuid" // Optional - can be updated or removed
}
```

**Response (200):**

```json
{
  "message": "Journal entry updated successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "userId": "uuid",
    "classId": "uuid",
    "entryText": "Updated journal entry text with new insights from today's session.",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z",
    "user": {
      "id": "uuid",
      "first_name": "John",
      "last_name": "Doe",
      "email": "john@example.com"
    },
    "class": {
      "id": "uuid",
      "title": "Yoga for Beginners",
      "description": "A gentle introduction to yoga"
    }
  }
}
```

**Validation:**

- `id` and `entryText` are required
- `classId` is optional but must be valid if provided

**Security:** Users can only edit their own journal entries.

### 5. Delete Journal Entry

**POST** `/api/journal/delete`

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
  "message": "Journal entry deleted successfully",
  "status": true,
  "data": null
}
```

**Error Response (404):**

```json
{
  "message": "Journal entry not found or access denied",
  "status": false,
  "data": null
}
```

**Security:** Users can only delete their own journal entries.

## Error Responses

### 400 Bad Request

```json
{
  "message": "Entry text is required",
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
  "message": "Access denied. Required role: user",
  "status": false,
  "data": null
}
```

### 404 Not Found

```json
{
  "message": "Journal entry not found or access denied",
  "status": false,
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "message": "Failed to create journal entry",
  "status": false,
  "data": "An error occurred"
}
```

## Data Model

### Journal Entry Structure

```json
{
  "id": "uuid",
  "userId": "uuid",
  "classId": "uuid", // Optional - links to a specific class/session
  "entryText": "string",
  "createdAt": "datetime",
  "updatedAt": "datetime",
  "deletedAt": "datetime" // Soft delete timestamp
}
```

### Associations

- **User**: Each journal entry belongs to a user
- **Class**: Each journal entry can be optionally linked to a class/session

## Security Features

1. **Authentication Required**: All endpoints require valid JWT token
2. **User Role Verification**: Only regular users can access journal endpoints
3. **Data Isolation**: Users can only access their own journal entries
4. **Soft Delete**: Journal entries are soft deleted (not permanently removed)
5. **Input Validation**: All inputs are validated before processing

## Usage Examples

### Creating a Journal Entry After a Session

```bash
curl -X POST http://localhost:3000/api/journal/create \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "entryText": "The meditation session today helped me find inner peace. I feel more centered and focused.",
    "classId": "class-uuid-here"
  }'
```

### Listing Recent Journal Entries

```bash
curl -X GET "http://localhost:3000/api/journal/list?page=1&limit=5" \
  -H "Authorization: <jwt_token>"
```

### Getting a Single Journal Entry

```bash
curl -X POST http://localhost:3000/api/journal/detail \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "journal-entry-uuid"
  }'
```

### Updating a Journal Entry

```bash
curl -X POST http://localhost:3000/api/journal/edit \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "journal-entry-uuid",
    "entryText": "Updated reflection on today's session with additional insights."
  }'
```

## Notes

- Journal entries are completely private to the user
- Practitioners and administrators cannot access user journal entries
- Entries can be linked to specific classes/sessions for better organization
- All timestamps are in ISO 8601 format
- Pagination is available for listing entries
- Soft delete is implemented for data recovery
