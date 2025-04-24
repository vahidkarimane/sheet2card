# Google Sheets to Supabase Integration

This document explains how the integration between Google Sheets and Supabase works in this application.

## Overview

The application reads product data from Google Sheets once per day and stores it in Supabase. This approach provides several benefits:

1. **Reduced API calls**: Instead of calling the Google Sheets API for every user request, we only sync once per day.
2. **Improved performance**: Supabase provides faster query performance compared to the Google Sheets API.
3. **Offline availability**: If the Google Sheets API is temporarily unavailable, the application can still serve product data from Supabase.
4. **Reduced costs**: Fewer API calls to Google Sheets means lower costs and less chance of hitting rate limits.

## Architecture

The integration consists of the following components:

1. **Google Sheets API Client**: Located in `lib/googleSheets.ts`, this module handles fetching data from Google Sheets.
2. **Supabase Client**: Located in `lib/supabase/index.ts`, this module handles interactions with the Supabase database.
3. **Sync Service**: Located in `lib/sync/index.ts`, this service orchestrates the sync process between Google Sheets and Supabase.
4. **API Routes**:
   - `/api/products-supabase`: Fetches products from Supabase with fallback to Google Sheets.
   - `/api/sync-products`: Manually triggers a sync operation.
   - `/api/cron/sync-products`: Endpoint for the scheduled daily sync.
5. **Scripts**:
   - `scripts/setup-supabase.ts`: Sets up the Supabase database schema.
   - `scripts/sync-products.ts`: Manually syncs products from Google Sheets to Supabase.

## Data Flow

1. **Daily Sync**: Every day at midnight, the Vercel cron job calls the `/api/cron/sync-products` endpoint.
2. **Sync Process**:
   - Fetch all sheet names (categories) from Google Sheets.
   - For each category, fetch products from the corresponding sheet.
   - Convert Google Sheets products to Supabase products.
   - Upsert products to Supabase.
3. **User Requests**:
   - When a user visits the products page, the application fetches products from Supabase.
   - If the Supabase fetch fails, the application falls back to fetching from Google Sheets.

## Setup and Configuration

### Environment Variables

The following environment variables are required:

```
# Google Sheets API credentials
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_SHEET_ID=your-google-sheet-id

# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# API Keys for sync operations
SYNC_API_KEY=your-sync-api-key
CRON_SECRET_TOKEN=your-cron-secret-token
```

### Initial Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Set up the Supabase database:
   ```
   npm run setup-supabase
   ```

3. Perform the initial sync:
   ```
   npm run sync-products
   ```

### Scheduled Sync

The application uses Vercel Cron Jobs to schedule the daily sync. The configuration is in `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sync-products",
      "schedule": "0 0 * * *"
    }
  ]
}
```

This schedules the sync to run every day at midnight.

## Security

The sync endpoints are protected in two ways:

1. **Clerk Authentication**: For manual syncs triggered by authenticated users.
2. **API Key Authentication**: For scheduled syncs triggered by the cron job.

## Error Handling and Fallbacks

If the Supabase database is unavailable or returns an error, the application automatically falls back to fetching data directly from Google Sheets. This ensures that users can always access product data, even if there are issues with the Supabase database.

## Monitoring and Maintenance

- Check the application logs for any sync errors.
- Periodically verify that the sync is working correctly by checking the `last_synced_at` timestamps in the Supabase database.
- If you make changes to the Google Sheets structure, you may need to update the corresponding code in `lib/googleSheets.ts` and `lib/supabase/schema.ts`.
