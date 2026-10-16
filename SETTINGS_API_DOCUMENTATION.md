# Settings Management API Documentation

## Overview

The Settings Management module provides APIs to manage application configuration settings. Only admin users can manage these settings. The slug field is not editable once created.

## API Endpoints

### Authentication

All admin endpoints require:

- Valid JWT token in Authorization header
- Admin role verification

### 1. Add Setting

**POST** `/api/setting/create`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "title": "Social Media Links",
  "slug": "social_media_links",
  "configValue": "https://facebook.com/sanara",
  "field_type": "string"
}
```

**Response (201):**

```json
{
  "message": "Setting created successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Social Media Links",
    "slug": "social_media_links",
    "configValue": "https://facebook.com/sanara",
    "field_type": "string",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Validation:**

- All fields (title, slug, field_type) are required
- Slug must be unique
- field_type must be one of: numeric, date, string, image, email, boolean, textarea, select

### 2. Edit Setting

**POST** `/api/setting/edit`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "title": "Updated Social Media Links",
  "configValue": "https://twitter.com/sanara",
  "field_type": "string"
}
```

**Response (200):**

```json
{
  "message": "Setting updated successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Updated Social Media Links",
    "slug": "social_media_links",
    "configValue": "https://twitter.com/sanara",
    "field_type": "string",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

**Note:** Slug cannot be edited once created.

### 3. Delete Setting (Soft Delete)

**POST** `/api/setting/delete`

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
  "message": "Setting deleted successfully",
  "status": true,
  "data": null
}
```

### 4. View Setting Detail

**POST** `/api/setting/detail`

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
  "message": "Setting fetched successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Site Name",
    "slug": "site_name",
    "configValue": "Sanara",
    "field_type": "string",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### 5. List Settings

**GET** `/api/setting/list`

**Headers:**

```
Authorization: <jwt_token>
```

**Query Parameters:**

- `field_type` (optional): Filter by field type
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Example:**

```
GET /api/setting/list?field_type=string&page=1&limit=5
```

**Response (200):**

```json
{
  "message": "Settings list fetched successfully",
  "status": true,
  "data": {
    "settings": [
      {
        "id": "uuid",
        "title": "Site Name",
        "slug": "site_name",
        "configValue": "Sanara",
        "field_type": "string",
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

### 6. Update Setting Value Only

**POST** `/api/setting/update-value`

**Headers:**

```
Authorization: <jwt_token>
Content-Type: application/json
```

**Request Body:**

```json
{
  "id": "uuid",
  "configValue": "New Site Name"
}
```

**Response (200):**

```json
{
  "message": "Setting value updated successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Site Name",
    "slug": "site_name",
    "configValue": "New Site Name",
    "field_type": "string",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

### 7. Public Setting Access (No Authentication Required)

**GET** `/api/setting/public/:slug`

**Response (200):**

```json
{
  "message": "Setting fetched successfully",
  "status": true,
  "data": {
    "id": "uuid",
    "title": "Site Name",
    "slug": "site_name",
    "configValue": "Sanara",
    "field_type": "string",
    "createdAt": "2024-12-01T00:00:00.000Z",
    "updatedAt": "2024-12-01T00:00:00.000Z"
  }
}
```

## Field Types

| Type       | Description                 | Example Usage                     |
| ---------- | --------------------------- | --------------------------------- |
| `string`   | Simple text input           | Site name, contact phone          |
| `textarea` | Multi-line text input       | Site description, terms           |
| `email`    | Email input with validation | Contact email, support email      |
| `numeric`  | Number input                | Session timeout, file size limits |
| `boolean`  | True/false toggle           | Maintenance mode, feature flags   |
| `image`    | Image file upload           | Site logo, favicon                |
| `date`     | Date picker                 | Launch date, maintenance date     |
| `select`   | Dropdown selection          | Currency, timezone, language      |

## Error Responses

### 400 Bad Request

```json
{
  "message": "Title, slug, and field_type are required",
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
  "message": "Setting not found",
  "status": false,
  "data": null
}
```

### 500 Internal Server Error

```json
{
  "message": "Failed to create setting",
  "status": false,
  "data": "Error details"
}
```

## Usage Examples

### Creating a new setting

```bash
curl -X POST http://localhost:3000/api/setting/create \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Social Media Links",
    "slug": "social_media_links",
    "configValue": "https://facebook.com/sanara",
    "field_type": "string"
  }'
```

### Editing a setting

```bash
curl -X POST http://localhost:3000/api/setting/edit \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "title": "Updated Social Media Links",
    "configValue": "https://twitter.com/sanara",
    "field_type": "string"
  }'
```

### Updating only the value

```bash
curl -X POST http://localhost:3000/api/setting/update-value \
  -H "Authorization: <jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "id": "uuid",
    "configValue": "New Site Name"
  }'
```

### Public access to setting

```bash
curl http://localhost:3000/api/setting/public/site_name
```

## Initial Settings

The system comes pre-populated with common application settings:

### Basic Settings

- **Site Name** (`site_name`) - Application name
- **Site Description** (`site_description`) - Application description
- **Contact Email** (`contact_email`) - Primary contact email
- **Contact Phone** (`contact_phone`) - Primary contact phone
- **Site Logo** (`site_logo`) - Application logo path

### System Settings

- **Maintenance Mode** (`maintenance_mode`) - Enable/disable maintenance mode
- **Registration Enabled** (`registration_enabled`) - Allow new user registrations
- **Session Timeout** (`session_timeout`) - User session duration in seconds
- **Max File Upload Size** (`max_file_upload_size`) - Maximum file upload size in bytes
- **Default Currency** (`default_currency`) - Default currency for the application

## Best Practices

1. **Slug Naming**: Use lowercase with underscores (e.g., `site_name`, `contact_email`)
2. **Field Types**: Choose appropriate field types for validation and UI rendering
3. **Default Values**: Provide sensible default values for new settings
4. **Validation**: Validate field types and required fields
5. **Security**: Only admins can manage settings
6. **Performance**: Use pagination for large lists of settings
