# Projects Page Revamp - Implementation Guide

## Overview
This guide walks you through implementing the new professional Projects page with:
- ✅ Drag-drop avatar uploads to Backblaze B2
- ✅ Professional work location selector
- ✅ Budget range instead of single value
- ✅ Feature/skill adding system (like Masterclass)
- ✅ Database integration for persistence
- ✅ Improved form validation

---

## Step 1: Database Setup

### Run this SQL in Supabase SQL Editor

Copy and paste the entire SQL code from the earlier response. It creates:
- `projects_page_providers` table (for talent/team/agency profiles)
- `projects_page_jobs` table (for job postings)
- RLS policies for security
- Proper indexes

**No Supabase storage bucket needed** — we use Backblaze B2 exclusively for avatars.

---

## Step 2: Files Created

The following new files have been created for you:

### Components:
1. **`src/components/ProjectsPageAvatarUpload.tsx`**
   - Drag-drop avatar upload component
   - Validates file type and size (max 5MB)
   - Shows preview before upload
   - Uploads directly to B2 using existing `upload-to-b2` edge function

2. **`src/components/ImprovedAddProviderForm.tsx`**
   - Professional form for talent/team/agency profiles
   - Integrated avatar upload
   - Work location selector (remote, on-site, hybrid, flexible)
   - Services/specialties system (add via button, max 10)
   - Form validation with error messages
   - Supports all provider types (talent, team, agency)

3. **`src/components/ImprovedAddJobForm.tsx`**
   - Professional job posting form
   - Work location selector
   - Budget range (min/max) with currency selection
   - Required skills system (add via button, max 15)
   - Job type selector (gig, full-time, part-time, contract)
   - Form validation with error messages

### Hooks:
1. **`src/hooks/useProjectsPageProviders.ts`**
   - `fetchAllProviders()` - Get all published providers
   - `fetchUserProviders()` - Get current user's providers
   - `createProvider(provider)` - Create new profile
   - `updateProvider(id, updates)` - Update existing profile
   - `deleteProvider(id)` - Delete profile
   - `publishProvider(id)` - Change status to published

2. **`src/hooks/useProjectsPageJobs.ts`**
   - `fetchAllJobs()` - Get all published job postings
   - `fetchUserJobs()` - Get current user's jobs
   - `createJob(job)` - Create new job posting
   - `updateJob(id, updates)` - Update existing job
   - `deleteJob(id)` - Delete job posting
   - `publishJob(id)` - Change status to published
   - `closeJob(id)` - Close job (stop accepting applications)

---

## Step 3: Understanding the Avatar Upload Flow

### How it works:

1. **User selects image** → Drag-drop or file picker
2. **Preview displayed** → User confirms
3. **Upload to B2**:
   - Filename: `projects_page_avatars/{user_id}/{timestamp}_{originalname}`
   - Uses existing `get-signed-upload-url` edge function
   - Uses existing `upload-to-b2` edge function
4. **URL returned** → Stored in database
5. **Component callback** → Parent form receives full public URL

### No Edge Function Changes Needed!
The existing edge functions already support this. Pass the folder path in the filename:

```typescript
const filename = `projects_page_avatars/${userId}/${Date.now()}_${file.name}`;
// Pass to get-signed-upload-url and upload-to-b2 functions
```

---

## Step 4: Update Projects.tsx

### Import the new components at the top:

```typescript
import ImprovedAddProviderForm from '../components/ImprovedAddProviderForm';
import ImprovedAddJobForm from '../components/ImprovedAddJobForm';
import { useProjectsPageProviders } from '../hooks/useProjectsPageProviders';
import { useProjectsPageJobs } from '../hooks/useProjectsPageJobs';
```

### Replace the Add Tab content:

Find the section where `activeTab === 'add'` renders. Replace the entire section with:

```typescript
{activeTab === 'add' && (
  <div className="grid grid-cols-1 gap-6 lg:col-span-3">
    {/* Create a new job posting */}
    <div className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
      <h3 className="text-2xl font-semibold text-white mb-1">Create a new job posting</h3>
      <p className="text-gray-400 text-sm mb-6">
        Post a new job or project to find talented professionals
      </p>
      <ImprovedAddJobForm
        onCreate={async (job) => {
          try {
            await createJob(job);
            setActiveTab('apply');
            setSearchQuery('');
            alert('Job posted successfully! It will appear in the Apply tab once published.');
          } catch (err) {
            alert('Failed to create job posting');
          }
        }}
      />
    </div>

    {/* Add your provider profile */}
    <div className="glass-effect rounded-2xl overflow-hidden hover-lift p-6">
      <h3 className="text-2xl font-semibold text-white mb-1">Add your professional profile</h3>
      <p className="text-gray-400 text-sm mb-6">
        Create a talent, team, or agency profile to showcase your services
      </p>
      <ImprovedAddProviderForm
        onCreate={async (provider, kind) => {
          try {
            await createProvider(provider);
            setActiveTab('hire');
            setEntityType(kind);
            alert(
              `Profile created successfully! You can now publish it from the ${kind} list.`
            );
          } catch (err) {
            alert('Failed to create provider profile');
          }
        }}
      />
    </div>
  </div>
)}
```

### Initialize the hooks in the component:

```typescript
const {
  jobs: allJobs,
  userJobs,
  createJob,
  updateJob,
  deleteJob,
  publishJob,
  closeJob,
} = useProjectsPageJobs();

const {
  providers: allProviders,
  userProviders,
  createProvider,
  updateProvider,
  deleteProvider,
  publishProvider,
} = useProjectsPageProviders();
```

### Update the Hire and Apply tabs to use database data:

Instead of local state (`talents`, `teams`, `agencies`, `projects`), use:
- `allProviders` filtered by `provider_type`
- `allJobs` for the Apply tab

Example:

```typescript
{activeTab === 'hire' && entityType === 'talents' &&
  allProviders
    .filter((p) => p.provider_type === 'talent' && p.status === 'published')
    .map((provider) => (
      // Render provider card
    ))}
```

---

## Step 5: Key Features & Improvements

### 1. Avatar Upload (Inline with Drag-Drop)
- Direct integration in the provider form
- Drag-drop or click to select
- Real-time preview
- Max 5MB, JPEG/PNG/GIF/WebP only
- Uploads to B2 with user folder structure

### 2. Work Location (4 Options)
Instead of text field, now uses buttons:
- Remote
- On-site
- Hybrid
- Flexible

Shows optional location field when needed.

### 3. Budget Range (Jobs Only)
- Min and Max budget inputs
- Currency selector (UGX, USD, EUR, GBP)
- More flexible than fixed budget

### 4. Services/Skills Adding System
Like Masterclass:
- Text input + Add button
- Press Enter or click Add
- Displays as removable tags
- Max 10 services, 15 skills

### 5. Form Validation
- Real-time error display
- Validation on submit
- Clear error messages
- Shows character count for textareas

---

## Step 6: Database Schema Reference

### projects_page_providers
```
- id (UUID)
- user_id (UUID) - FK to auth.users
- provider_type (talent | team | agency)
- name, title_or_type, category
- avatar_url (B2 public URL)
- description
- work_location (remote | on-site | hybrid | flexible)
- optional_location (city/region if needed)
- services (JSON array of strings)
- hourly_rate / starting_rate / team_size
- rating, reviews_count, completed_projects
- response_time
- status (draft | published | archived)
- created_at, updated_at
```

### projects_page_jobs
```
- id (UUID)
- user_id (UUID) - FK to auth.users
- title, company, description
- work_location (remote | on-site | hybrid | flexible)
- optional_location (city/region if needed)
- currency (UGX | USD | EUR | GBP)
- budget_min, budget_max
- skills (JSON array of strings)
- category
- job_type (gig | full-time | part-time | contract)
- status (draft | published | closed | archived)
- applications_count
- created_at, updated_at
```

---

## Step 7: B2 Folder Structure

Avatars are stored in B2 with this structure:
```
prestablaze/
├── projects_page_avatars/
│   ├── {user_id}/
│   │   ├── 1702568941234_profile.png
│   │   ├── 1702568942156_avatar.jpg
│   │   └── ...
│   └── ...
```

**Public URL example:**
```
https://s3.eu-central-003.backblazeb2.com/prestablaze/projects_page_avatars/{user_id}/1702568941234_profile.png
```

The component handles all of this automatically!

---

## Step 8: Testing the Implementation

1. **Test Avatar Upload:**
   - Fill out provider form
   - Drag-drop an image
   - Verify preview shows
   - Submit form
   - Check database for avatar_url

2. **Test Form Validation:**
   - Try submitting empty form
   - Verify error messages
   - Add services/skills
   - Remove some and add others

3. **Test Location Selection:**
   - Try each work location option
   - For on-site/hybrid, verify location field appears

4. **Test Budget Range:**
   - Enter min < max
   - Try max < min (should error)
   - Change currency

---

## Troubleshooting

### Avatar not uploading?
- Check B2 credentials in Supabase environment
- Verify `upload-to-b2` edge function is deployed
- Check file size < 5MB and format is allowed

### Database queries failing?
- Verify SQL was executed successfully
- Check RLS policies are enabled
- Ensure user is authenticated

### Forms not validating?
- Check console for errors
- Verify form state is updating

### Services/skills not showing?
- Check component is using the correct state array
- Verify Add button handler is called

---

## Next Steps

1. ✅ Run the SQL code
2. ✅ Import new components and hooks into Projects.tsx
3. ✅ Update the Add tab to use new forms
4. ✅ Update Hire/Apply tabs to use database data
5. ✅ Test avatar upload flow
6. ✅ Test form validation
7. ✅ Deploy and monitor

---

## Questions?

The components are self-contained and production-ready. They handle:
- File validation
- B2 upload with error handling
- Database operations with optimistic updates
- Form validation with user feedback
- RLS security

All existing code remains unchanged except for the Add tab content.
