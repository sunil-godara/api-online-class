# PostgreSQL Migration Guide

This guide will help you migrate your application from MySQL to PostgreSQL.

## Prerequisites

1. **Install PostgreSQL** on your system
2. **Install Node.js PostgreSQL driver**
3. **Update environment variables**

## Installation Steps

### 1. Install PostgreSQL

#### Ubuntu/Debian:

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

#### macOS (using Homebrew):

```bash
brew install postgresql
brew services start postgresql
```

#### Windows:

Download and install from [PostgreSQL official website](https://www.postgresql.org/download/windows/)

### 2. Install Node.js Dependencies

```bash
# Remove MySQL driver
npm uninstall mysql2

# Install PostgreSQL drivers
npm install pg pg-hstore
```

### 3. Database Setup

#### Create PostgreSQL Database:

```bash
# Connect to PostgreSQL as superuser
sudo -u postgres psql

# Create database and user
CREATE DATABASE sanara_pwa;
CREATE USER your_username WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE sanara_pwa TO your_username;
\q
```

#### Or using psql directly:

```bash
psql -U postgres -h localhost
```

### 4. Environment Configuration

Update your `.env` file:

```env
# Database Configuration
DB_HOST=localhost
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=sanara_pwa
DB_DIALECT=postgres
DB_PORT=5432
DB_LOGGING=false
```

### 5. Database Migration

```bash
# Run migrations to create tables
npm run db:migrate

# Run seeders to populate initial data
npm run db:seed
```

## Key Changes Made

### 1. Package.json

- Replaced `mysql2` with `pg` and `pg-hstore`
- Added PostgreSQL-specific dependencies

### 2. Database Configuration (config/config.js)

- Added PostgreSQL-specific settings
- Included SSL configuration for production
- Added connection pooling settings
- Added port configuration

### 3. Environment Variables (.env)

- Changed `DB_DIALECT` from `mysql` to `postgres`
- Updated default user from `root` to `postgres`
- Added `DB_PORT=5432`

## PostgreSQL-Specific Features

### 1. Connection Pooling

The configuration includes optimized connection pooling:

- **Development/Test**: max 5 connections
- **Production**: max 10 connections

### 2. SSL Support

- **Development**: SSL disabled
- **Production**: SSL enabled with certificate validation disabled

### 3. UUID Support

PostgreSQL has native UUID support, which works perfectly with your existing UUID fields.

## Troubleshooting

### Common Issues

#### 1. Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Start PostgreSQL if not running
sudo systemctl start postgresql
```

#### 2. Authentication Failed

```bash
# Check pg_hba.conf for authentication settings
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL after changes
sudo systemctl restart postgresql
```

#### 3. Database Not Found

```bash
# Connect to PostgreSQL and create database
psql -U postgres -h localhost
CREATE DATABASE sanara_pwa;
```

#### 4. Permission Denied

```bash
# Grant necessary permissions
psql -U postgres -h localhost
GRANT ALL PRIVILEGES ON DATABASE sanara_pwa TO your_username;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO your_username;
```

### 3. Port Issues

```bash
# Check if port 5432 is in use
sudo netstat -tlnp | grep 5432

# Check PostgreSQL configuration
sudo nano /etc/postgresql/*/main/postgresql.conf
```

## Performance Optimization

### 1. Indexes

PostgreSQL automatically creates indexes for primary keys and unique constraints.

### 2. Connection Pooling

The configuration includes optimized connection pooling settings.

### 3. SSL Configuration

Production environment includes SSL for secure connections.

## Migration Verification

### 1. Test Database Connection

```bash
# Test connection using psql
psql -U your_username -h localhost -d sanara_pwa
```

### 2. Run Application Tests

```bash
# Start the application
npm run dev

# Test API endpoints
curl http://localhost:3002/auth/me
```

### 3. Verify Data Integrity

```bash
# Check if tables were created
psql -U your_username -h localhost -d sanara_pwa
\dt

# Check if seed data was inserted
SELECT * FROM users;
```

## Backup and Restore

### Backup MySQL Data (if needed)

```bash
mysqldump -u root -p sanara_pwa > backup.sql
```

### Restore to PostgreSQL

```bash
# Convert and restore data (manual process required)
# Use tools like pgloader or manual conversion
```

## Production Deployment

### 1. Environment Variables

Ensure all production environment variables are set correctly:

```env
NODE_ENV=production
DB_HOST=your_production_host
DB_USER=your_production_user
DB_PASSWORD=your_production_password
DB_NAME=your_production_db
DB_DIALECT=postgres
DB_PORT=5432
```

### 2. SSL Configuration

Production environment automatically enables SSL for secure connections.

### 3. Connection Pooling

Production uses optimized connection pooling with max 10 connections.

## Benefits of PostgreSQL

1. **Better JSON Support**: Native JSON/JSONB data types
2. **Advanced Indexing**: GIN, GiST, and other index types
3. **Full-Text Search**: Built-in full-text search capabilities
4. **Geographic Data**: PostGIS extension for spatial data
5. **ACID Compliance**: Full ACID transaction support
6. **Extensibility**: Easy to add custom functions and data types

## Next Steps

1. **Test thoroughly** in development environment
2. **Update documentation** for your team
3. **Monitor performance** after migration
4. **Consider PostgreSQL-specific optimizations**

## Support

If you encounter issues:

1. Check PostgreSQL logs: `/var/log/postgresql/`
2. Verify connection settings
3. Test with simple queries first
4. Consult PostgreSQL documentation

The migration is now complete! Your application should work seamlessly with PostgreSQL.
