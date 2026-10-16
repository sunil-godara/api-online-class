# Settings Table Documentation

## Overview

The Settings table is designed to store application configuration values that can be managed through the admin interface. It supports various field types for different kinds of settings.

## Database Schema

### Table: `settings`

| Field       | Type         | Description                          |
| ----------- | ------------ | ------------------------------------ |
| id          | UUID (PK)    | Auto-generated primary key           |
| title       | VARCHAR(255) | Human-readable title for the setting |
| slug        | VARCHAR(255) | Unique identifier for the setting    |
| configValue | VARCHAR(255) | The actual configuration value       |
| field_type  | ENUM         | Type of field for UI rendering       |
| createdAt   | DATETIME     | Created timestamp                    |
| updatedAt   | DATETIME     | Updated timestamp                    |
| deletedAt   | DATETIME     | Soft-delete timestamp (nullable)     |

### Field Types

The `field_type` enum supports the following values:

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

## Initial Data

The settings table comes pre-populated with common application settings:

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

## Usage Examples

### Getting a Setting Value

```javascript
const Setting = require('../models/setting');

// Get a specific setting by slug
const siteName = await Setting.findOne({
  where: { slug: 'site_name' }
});

console.log(siteName.configValue); // "Sanara"
```

### Updating a Setting

```javascript
const Setting = require('../models/setting');

// Update a setting value
await Setting.update({ configValue: 'New Site Name' }, { where: { slug: 'site_name' } });
```

### Getting All Settings

```javascript
const Setting = require('../models/setting');

// Get all settings
const allSettings = await Setting.findAll({
  order: [['title', 'ASC']]
});

// Convert to key-value object
const settingsObject = allSettings.reduce((acc, setting) => {
  acc[setting.slug] = setting.configValue;
  return acc;
}, {});
```

### Adding New Settings

```javascript
const Setting = require('../models/setting');

// Add a new setting
await Setting.create({
  title: 'Social Media Links',
  slug: 'social_media_links',
  configValue: 'https://facebook.com/sanara',
  field_type: 'string'
});
```

## Common Use Cases

### 1. Application Configuration

```javascript
// Get application settings
const settings = await Setting.findAll();
const config = settings.reduce((acc, setting) => {
  acc[setting.slug] = setting.configValue;
  return acc;
}, {});

// Use in application
app.set('siteName', config.site_name);
app.set('maintenanceMode', config.maintenance_mode === 'true');
```

### 2. Feature Flags

```javascript
// Check if feature is enabled
const registrationEnabled = await Setting.findOne({
  where: { slug: 'registration_enabled' }
});

if (registrationEnabled.configValue === 'true') {
  // Allow registration
} else {
  // Disable registration
}
```

### 3. Dynamic Content

```javascript
// Get contact information
const contactEmail = await Setting.findOne({
  where: { slug: 'contact_email' }
});

// Use in templates or API responses
res.json({
  contact: {
    email: contactEmail.configValue
  }
});
```

## Validation Rules

### Required Fields

- `title` - Must not be empty
- `slug` - Must be unique, alphanumeric with underscores
- `field_type` - Must be one of the defined enum values

### Field Type Validation

- `email` - Should contain valid email format
- `numeric` - Should contain valid number
- `boolean` - Should be 'true' or 'false' string
- `date` - Should contain valid date format

## Best Practices

### 1. Naming Conventions

- Use descriptive titles for settings
- Use lowercase with underscores for slugs
- Group related settings with common prefixes

### 2. Default Values

- Always provide sensible default values
- Use appropriate field types for the data
- Consider validation requirements

### 3. Performance

- Cache frequently accessed settings
- Use bulk operations for multiple updates
- Index the slug field for faster lookups

### 4. Security

- Validate all input values
- Sanitize data before storage
- Use appropriate field types for validation

## Migration and Seeding

### Running Migration

```bash
npx sequelize-cli db:migrate
```

### Running Seeder

```bash
npx sequelize-cli db:seed --seed 20241201000002-settings.js
```

### Undoing Migration

```bash
npx sequelize-cli db:migrate:undo --name 20241201000024-settings.js
```

## Model Methods

The Setting model includes standard Sequelize methods:

- `findAll()` - Get all settings
- `findOne()` - Get single setting
- `create()` - Create new setting
- `update()` - Update existing setting
- `destroy()` - Soft delete setting
- `restore()` - Restore soft-deleted setting

## Future Enhancements

Potential improvements for the settings system:

1. **Caching Layer** - Redis cache for frequently accessed settings
2. **Validation Rules** - Custom validation for different field types
3. **Audit Trail** - Track changes to settings
4. **Environment Overrides** - Different values for different environments
5. **Bulk Operations** - Update multiple settings at once
6. **API Endpoints** - RESTful API for managing settings
7. **UI Components** - React components for different field types
