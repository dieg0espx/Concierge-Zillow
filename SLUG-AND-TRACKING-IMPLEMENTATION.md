# Custom URL Slugs & Last Accessed Tracking Implementation

## Overview
This implementation adds two key features to the client management system:
1. **Custom URL Slugs**: Replace UUID-based URLs with SEO-friendly slugs (e.g., `/client/smith-family`)
2. **Last Accessed Tracking**: Track when clients view their portfolio pages

## Database Changes Required

### Step 1: Run this SQL in your Supabase SQL Editor

```sql
-- Add slug column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
CREATE INDEX IF NOT EXISTS idx_clients_slug ON clients(slug);
COMMENT ON COLUMN clients.slug IS 'URL-friendly slug for client (e.g., smith-family)';

-- Add last_accessed column
ALTER TABLE clients ADD COLUMN IF NOT EXISTS last_accessed TIMESTAMP WITH TIME ZONE;
CREATE INDEX IF NOT EXISTS idx_clients_last_accessed ON clients(last_accessed);
COMMENT ON COLUMN clients.last_accessed IS 'Timestamp when client last viewed their portfolio page';

-- Generate slugs for existing clients (run this after the columns are added)
DO $$
DECLARE
  client_record RECORD;
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  attempt INT;
BEGIN
  FOR client_record IN
    SELECT id, name FROM clients WHERE slug IS NULL
  LOOP
    -- Generate base slug from name
    base_slug := regexp_replace(
      regexp_replace(lower(client_record.name), '[^a-z0-9]+', '-', 'g'),
      '^-+|-+$', '', 'g'
    );

    final_slug := base_slug;
    attempt := 0;

    -- Ensure uniqueness
    LOOP
      SELECT EXISTS(SELECT 1 FROM clients WHERE slug = final_slug) INTO slug_exists;

      IF NOT slug_exists THEN
        EXIT;
      END IF;

      attempt := attempt + 1;
      final_slug := base_slug || '-' || substr(md5(random()::text), 1, 4);

      IF attempt > 10 THEN
        EXIT;
      END IF;
    END LOOP;

    -- Update client with generated slug
    UPDATE clients SET slug = final_slug WHERE id = client_record.id;
    RAISE NOTICE 'Generated slug for %: %', client_record.name, final_slug;
  END LOOP;
END $$;
```

## Features Implemented

### 1. Custom URL Slugs

#### Auto-generation
- Slugs are automatically generated from client names when creating new clients
- Format: lowercase letters, numbers, and hyphens only
- Automatic uniqueness checking with random suffix if needed
- Example: "John Smith" → "john-smith"

#### Manual Customization
- Admins can set custom slugs in the client edit dialog
- Real-time validation ensures proper format
- Duplicate slug prevention with helpful error messages
- Field location: Client Edit Dialog → "Custom URL Slug" field

#### URL Format
- **Old**: `/client/550e8400-e29b-41d4-a716-446655440000` (UUID)
- **New**: `/client/smith-family` (slug) or `/client/john-doe` (slug)
- **Backward Compatible**: Both UUID and slug URLs work

#### Where URLs are Updated
- Client portfolio URL display (shows slug-based URL)
- Copy to clipboard functionality (copies slug-based URL)
- Preview links in admin panel (use slug if available)
- Direct navigation from clients list (uses slug)

### 2. Last Accessed Tracking

#### Tracking Mechanism
- Automatically tracks when a client views their portfolio page
- Updates `last_accessed` timestamp in database
- Non-blocking (doesn't slow down page load)
- Location: `/client/[id]` page (supports both UUID and slug)

#### Display
- Shown in clients list with green highlight
- Format: "Viewed: X days ago" or "Viewed: X hours ago"
- Only shows if client has accessed their page at least once
- Tooltip: "Last time client viewed their portfolio"

#### Visual Indicators
- Green text color (`text-green-400/70`) distinguishes from "Updated" timestamp
- Clock icon for consistency
- Responsive display (hidden on mobile if needed)

## Code Changes

### New Files Created

1. **`lib/utils/slug.ts`**
   - `generateSlug(text)`: Convert text to URL-safe slug
   - `generateUniqueSlug(baseSlug)`: Add random suffix for uniqueness
   - `isValidSlug(slug)`: Validate slug format
   - `sanitizeSlug(slug)`: Clean and validate slug

2. **`scripts/add-slug-and-last-accessed.js`**
   - Migration script with SQL generation
   - Documentation for manual SQL execution

3. **`SLUG-AND-TRACKING-IMPLEMENTATION.md`** (this file)
   - Complete implementation documentation

### Modified Files

1. **`lib/actions/clients.ts`**
   - Added `slug` and `last_accessed` to `Client` type
   - Updated `addClient()`: Generate unique slugs on creation
   - Updated `updateClient()`: Support slug editing with validation
   - Added `getClientBySlug()`: Fetch client by slug
   - Added `trackClientAccess()`: Update last_accessed timestamp

2. **`app/client/[id]/page.tsx`**
   - Supports both UUID and slug in URL
   - Automatic slug detection with regex
   - Tracks client access on page view
   - Uses `client.id` for database queries regardless of URL format

3. **`components/client-edit-dialog.tsx`**
   - Added `clientSlug` prop
   - New "Custom URL Slug" input field
   - Inline help text for slug formatting
   - Visual preview showing `/client/` prefix

4. **`components/client-url-display.tsx`**
   - Added `clientSlug` prop
   - Prioritizes slug over UUID in displayed URL
   - Copy functionality uses slug-based URL when available

5. **`app/admin/client/[id]/page.tsx`**
   - Passes `client.slug` to edit dialog
   - Passes `client.slug` to URL display component
   - Preview link uses slug when available

6. **`components/clients-list.tsx`**
   - Displays last accessed timestamp
   - Green color coding for "Viewed" time
   - Conditional rendering (only shows if accessed)
   - Added helpful tooltips

## Testing Checklist

### Manual Testing

- [ ] **Database Migration**
  - [ ] Run SQL script in Supabase SQL Editor
  - [ ] Verify `slug` column exists with UNIQUE constraint
  - [ ] Verify `last_accessed` column exists
  - [ ] Check that existing clients have auto-generated slugs

- [ ] **Client Creation**
  - [ ] Create new client, verify slug is auto-generated
  - [ ] Check that slug appears in URL display
  - [ ] Verify slug is URL-safe (lowercase, hyphens only)
  - [ ] Create client with duplicate name, verify unique suffix added

- [ ] **Client Editing**
  - [ ] Edit client, see current slug in edit dialog
  - [ ] Change slug to custom value, verify it saves
  - [ ] Try duplicate slug, verify error message appears
  - [ ] Try invalid characters, verify validation error

- [ ] **URL Access**
  - [ ] Access client page via slug URL: `/client/john-smith`
  - [ ] Access client page via UUID (old format): `/client/UUID`
  - [ ] Verify both formats work correctly
  - [ ] Check that properties load properly

- [ ] **Last Accessed Tracking**
  - [ ] Open client portfolio page (as client would see it)
  - [ ] Go to admin clients list
  - [ ] Verify "Viewed: X ago" appears in green
  - [ ] Wait and refresh, verify time updates
  - [ ] Check clients never accessed show no "Viewed" label

- [ ] **Copy URL Functionality**
  - [ ] Click copy button on client detail page
  - [ ] Verify clipboard contains slug-based URL
  - [ ] Paste and visit URL, verify it works
  - [ ] Check toast confirmation appears

## Benefits

### 1. Better User Experience
- **Memorable URLs**: `concierge-zillow.vercel.app/client/smith-family` vs random UUIDs
- **Professional Appearance**: Clients see personalized, branded URLs
- **Easy Sharing**: URLs are easier to read, remember, and share

### 2. SEO Advantages
- **Descriptive URLs**: Search engines prefer readable URLs
- **Keyword Rich**: Client names in URLs can improve search ranking
- **Better Click-Through**: Users more likely to click readable URLs

### 3. Analytics & Insights
- **Track Engagement**: See which clients are viewing their portfolios
- **Follow-up Timing**: Know when clients last viewed properties
- **Inactive Detection**: Identify clients who haven't viewed in a while

### 4. Admin Convenience
- **Custom Branding**: Set memorable slugs for VIP clients
- **URL Management**: Edit slugs without changing functionality
- **Audit Trail**: Track when clients engage with content

## Migration Path

### For Existing Deployments

1. **Backup Database**: Always backup before schema changes
2. **Run SQL Script**: Execute the provided SQL in Supabase SQL Editor
3. **Verify Migration**: Check that all existing clients have slugs
4. **Deploy Code**: Push the code changes to production
5. **Test URLs**: Verify both old (UUID) and new (slug) URLs work
6. **Update Links**: Gradually replace UUID links with slug links
7. **Monitor**: Watch for any 404 errors in application logs

### Rollback Plan

If issues occur:
1. Old UUID URLs continue to work (backward compatible)
2. Remove slug fields from UI if needed
3. Database columns are harmless if unused
4. Can drop columns later: `ALTER TABLE clients DROP COLUMN slug, DROP COLUMN last_accessed;`

## Future Enhancements

### Potential Additions
1. **Slug History**: Track slug changes for URL redirects
2. **Access Analytics**: Detailed view counts, time on page
3. **Email Notifications**: Alert managers when clients view portfolios
4. **Bulk Slug Editor**: Update multiple slugs at once
5. **Slug Suggestions**: AI-powered slug recommendations
6. **URL Redirects**: Auto-redirect old slugs to new ones if changed

## Support

### Common Issues

**Q: Slug already exists error?**
A: Each slug must be unique. Try adding a differentiator like "smith-family-ca" or "john-smith-buyer"

**Q: Old UUID URLs not working?**
A: Both formats are supported. Check that the UUID exists in the database.

**Q: Last accessed not updating?**
A: Ensure client is viewing `/client/[slug]` page, not the admin page. Check browser console for errors.

**Q: Slug contains invalid characters?**
A: Only lowercase letters (a-z), numbers (0-9), and hyphens (-) are allowed. No spaces, special characters, or uppercase.

### Debugging

Check these if issues occur:
1. Database: `SELECT id, name, slug, last_accessed FROM clients;`
2. Browser Network Tab: Look for 404s or 500 errors
3. Server Logs: Check Next.js console for errors
4. Supabase Logs: Check for database query failures

## Credits

Implementation completed: December 2024
Features: Custom URL slugs + Last accessed tracking
Backward Compatible: Yes (UUID URLs still work)
Database Impact: 2 new columns, 2 new indexes
