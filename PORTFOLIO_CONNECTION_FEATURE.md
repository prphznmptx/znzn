# Portfolio Connection Feature Implementation Guide

## Overview
This document outlines the implementation of the Portfolio Connection feature that allows users to sync their Portfolio profile data (name and avatar) with their Projects page service profiles (Talent, Team, or Agency).

## Features Implemented

### 1. Portfolio Profile Photo Upload
**Location**: `src/pages/Portfolio.tsx`

**Functionality**:
- Users can now upload their profile photo by clicking the upload button on the Portfolio page
- Photos are uploaded to Backblaze B2 in the `portfolio_profile_photos` folder
- The uploaded photo URL is saved to the user's profile in the `profiles` table
- Upload includes validation for file type (JPEG, PNG, GIF, WebP) and size (max 5MB)
- Shows real-time upload status with loading indicator and error messages

**Implementation Details**:
- Uses the existing `uploadToB2()` function from `src/lib/b2Upload.ts`
- Calls the Supabase Edge Function `upload-to-b2` for secure server-side upload
- Saves the public URL to `profiles.avatar_url` column
- File input is only active when in Edit mode (`isEditing` = true)

### 2. Portfolio Connection Toggle
**Location**: `src/components/PortfolioConnectionToggle.tsx`

**Functionality**:
- Toggle switch that connects/disconnects a Projects page profile to the user's Portfolio
- When toggled ON:
  - Fetches the user's profile data from the `profiles` table
  - Displays a confirmation showing the connected portfolio name
  - Passes the profile data to the form for auto-fill
- When toggled OFF:
  - Disconnects the Portfolio and allows manual entry
- Shows loading state during fetch operations
- Displays error messages if fetching profile data fails

**Props**:
- `isConnected`: Boolean indicating current connection state
- `onToggle`: Callback function with connection status and profile data
- `providerType`: Type of provider ('talent', 'team', or 'agency')

### 3. Form Integration
**Location**: `src/components/ImprovedAddProviderForm.tsx`

**Functionality**:
- Portfolio Connection toggle appears before the "Display Picture" / "Logo" section
- When portfolio is connected:
  - Full Name (or Business Name) field is auto-filled and disabled
  - Display Picture (or Logo) field shows portfolio avatar and is disabled
  - Fields display label "(from Portfolio)" to indicate synced data
  - User cannot manually edit these fields
- When portfolio is disconnected:
  - All fields are enabled for manual entry
  - User can upload custom display picture/logo

**Form Behavior**:
- Portfolio connection status is included in the provider data: `portfolio_connected: boolean`
- Form reset clears the portfolio connection state
- The `portfolio_connected` flag is saved to the database for persistence

### 4. Database Schema Updates
**Location**: `database/migrations/add_portfolio_connection_tracking.sql`

**Required Changes**:
```sql
ALTER TABLE public.projects_page_providers
ADD COLUMN IF NOT EXISTS portfolio_connected BOOLEAN DEFAULT FALSE;
```

**Additional Improvements**:
- Create index on `(user_id, portfolio_connected)` for faster queries
- This column tracks whether a provider is connected to the Portfolio

## Setup Instructions

### Step 1: Run Database Migration
Execute the SQL migration to add the `portfolio_connected` column:

```sql
-- From: database/migrations/add_portfolio_connection_tracking.sql
ALTER TABLE public.projects_page_providers
ADD COLUMN IF NOT EXISTS portfolio_connected BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_projects_page_providers_portfolio_connected
ON public.projects_page_providers(user_id, portfolio_connected)
WHERE portfolio_connected = TRUE;
```

Run this in your Supabase SQL editor.

### Step 2: Verify File Upload Configuration
Ensure that:
1. The B2 Edge Function `upload-to-b2` is deployed in your Supabase project
2. B2 bucket `prestablaze` exists and is configured
3. Environment variables are set:
   - `B2_KEY_ID`
   - `B2_APPLICATION_KEY`
   - `B2_S3_ENDPOINT`
   - `B2_BUCKET_NAME`
   - `B2_PUBLIC_URL`

## Testing Guide

### Test Portfolio Photo Upload
1. Navigate to Portfolio page
2. Click "Edit Portfolio" button
3. Click the upload icon on the profile image circle
4. Select an image from your device (JPEG, PNG, GIF, or WebP, max 5MB)
5. Verify the image displays in the profile circle
6. Verify the image persists after navigating away and returning

### Test Portfolio Connection
1. Navigate to Projects page → "Add" tab → "Services"
2. Select provider type (Talent, Team, or Agency)
3. Toggle the "Connect to Portfolio" switch ON
4. Verify:
   - Loading indicator appears briefly
   - Confirmation message shows connected portfolio name
   - Full Name / Business Name field is auto-filled with portfolio name
   - Display Picture / Logo shows portfolio photo
   - Both fields are disabled (grayed out)
5. Toggle the switch OFF
6. Verify:
   - Fields are re-enabled
   - You can manually enter data
   - You can upload custom images
7. Create a provider profile and save
8. Navigate back to the provider profile
9. Verify portfolio connection status is preserved

### Test Persistence
1. Create a provider with portfolio connection enabled
2. Publish/save the provider
3. Navigate away and back to the Projects page
4. Edit the provider again
5. Verify the portfolio_connected flag is preserved (you can check via browser dev tools or by checking if fields are pre-filled)

## File Structure

```
src/
├── pages/
│   ├── Portfolio.tsx (updated with photo upload)
│   └── Projects.tsx
├── components/
│   ├── ImprovedAddProviderForm.tsx (updated with portfolio toggle)
│   ├── PortfolioConnectionToggle.tsx (new component)
│   └── ProjectsPageAvatarUpload.tsx (updated with disabled state)
├── hooks/
│   ├── useProjectsPageProviders.ts (updated interface)
│   └── useProjectsPageJobs.ts
├── lib/
│   ├── supabase.ts
│   └── b2Upload.ts
└── context/
    └── AuthContext.tsx

database/
└── migrations/
    └── add_portfolio_connection_tracking.sql (new migration)
```

## Technical Details

### Portfolio Photo Upload Flow
1. User selects image from device
2. File is validated (type, size)
3. File is uploaded via Supabase Edge Function to B2
4. Public URL is returned
5. URL is saved to `profiles.avatar_url`
6. URL is displayed in the portfolio image circle

### Portfolio Connection Flow
1. User toggles Portfolio Connection ON
2. Component fetches user's profile: `SELECT name, avatar_url FROM profiles WHERE id = user_id`
3. Profile data is passed to form via `onToggle` callback
4. Form auto-fills name and avatar fields
5. Fields are disabled to prevent manual editing
6. When creating/editing provider, `portfolio_connected: true` is saved
7. Next time user edits the provider, the flag can be checked to restore the connection state

### Database Consistency
- The `portfolio_connected` flag acts as metadata indicating the profile is synced
- Actual sync is triggered through application logic (form auto-fill)
- To implement real-time sync, create a database trigger or implement application-level logic to update provider name/avatar when profile changes

## Future Enhancements

1. **Real-time Sync**: Implement database trigger or event listener to automatically update provider name/avatar when portfolio profile changes
2. **Disconnect Warning**: Add confirmation dialog when disconnecting portfolio to warn about losing sync
3. **Sync Status**: Add indicator showing when provider data was last synced from portfolio
4. **Multiple Fields**: Extend to sync additional fields like bio, location, or skills
5. **Edit Existing Providers**: Add UI to edit existing providers and restore portfolio connection state

## Troubleshooting

### Photo Upload Fails
- Check B2 bucket configuration in environment variables
- Verify Edge Function is deployed: `upload-to-b2`
- Check file size (max 5MB)
- Check file format (JPEG, PNG, GIF, WebP)

### Portfolio Toggle Shows Error
- Verify user is authenticated
- Check that profile exists in `profiles` table
- Check Supabase RLS policies allow SELECT on profiles table
- Check browser console for detailed error messages

### Fields Not Pre-filling
- Verify Portfolio Connection toggle shows success message
- Check that portfolio name/avatar are set in portfolio profile
- Inspect form state in React DevTools

## Notes

- Avatar/Logo images are stored in Backblaze B2, not Supabase Storage
- Profile images use the `profiles.avatar_url` column
- Provider avatars are stored separately in the `projects_page_providers.avatar_url` column
- The connection preserves the flag but doesn't create a live sync - changes to portfolio require re-toggling or manual updates to the provider profile
