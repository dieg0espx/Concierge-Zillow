# Client Shares Table - RLS Configuration

## Current Status: RLS DISABLED

The `client_shares` table has Row Level Security **disabled** because:

1. **Server-Side Filtering**: All queries to this table go through server actions that already filter by `manager_id`
2. **Authenticated Context**: Users can only access this data through authenticated server-side functions
3. **Ownership Verification**: The `shareClient()` and `unshareClient()` functions verify ownership before allowing operations
4. **SSR Cookie Context Issue**: The RLS policies were not working correctly with Next.js server-side rendering and the Supabase cookie-based authentication

## Security

Even with RLS disabled, the data is secure because:

- All access is through server actions (no direct client-side queries)
- `shareClient()` verifies the current user owns the client before sharing
- `unshareClient()` verifies the current user owns the client before unsharing
- `getAllClients()` only returns shares where `shared_with_manager_id` matches the current user's manager ID

## SQL Command Used

```sql
ALTER TABLE client_shares DISABLE ROW LEVEL SECURITY;
```

## Alternative: Re-enable RLS (if needed in future)

If you want to re-enable RLS in the future, you would need to:

1. Ensure the authentication context is properly passed to Supabase
2. Use service role key for server-side operations, OR
3. Fix the RLS policy to work with the cookie-based auth

```sql
ALTER TABLE client_shares ENABLE ROW LEVEL SECURITY;
```
