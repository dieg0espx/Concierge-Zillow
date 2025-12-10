# Drag-and-Drop Reordering & Bulk Operations Implementation

## Overview
This implementation adds two major features to the client property assignment system:
1. **Drag-and-Drop Reordering**: Visually reorder properties within a client's portfolio
2. **Bulk Select/Add/Remove**: Select multiple properties at once for faster management

## Database Changes Required

### Step 1: Run this SQL in your Supabase SQL Editor

```sql
-- Add position column to client_property_assignments
ALTER TABLE client_property_assignments
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_client_property_assignments_position
ON client_property_assignments(client_id, position);

-- Add comment
COMMENT ON COLUMN client_property_assignments.position IS 'Display order of property for this client';

-- Initialize position values for existing assignments (ordered by created_at)
DO $$
DECLARE
  client_rec RECORD;
  assignment_rec RECORD;
  pos INTEGER;
BEGIN
  -- For each client
  FOR client_rec IN
    SELECT DISTINCT client_id FROM client_property_assignments
  LOOP
    pos := 0;

    -- For each assignment for this client (ordered by created_at)
    FOR assignment_rec IN
      SELECT id
      FROM client_property_assignments
      WHERE client_id = client_rec.client_id
        AND position IS NULL
      ORDER BY created_at ASC
    LOOP
      -- Set position
      UPDATE client_property_assignments
      SET position = pos
      WHERE id = assignment_rec.id;

      pos := pos + 1;
    END LOOP;

    RAISE NOTICE 'Initialized % assignments for client %', pos, client_rec.client_id;
  END LOOP;
END $$;
```

## Features Implemented

### 1. Drag-and-Drop Reordering

#### Desktop Experience
- **Drag Handle**: GripVertical icon on the left side of each property card
- **Visual Feedback**:
  - Dragged item becomes semi-transparent and slightly smaller
  - Drop zones show a thick white border (top or bottom depending on drag direction)
  - Smooth animations during reordering
- **Auto-scroll**: Automatically scrolls when dragging near top/bottom of viewport
- **Live Reordering**: Properties reorder in real-time as you drag
- **Auto-save**: Order is saved to database when drag ends

#### Mobile Experience
- **Arrow Buttons**: Up/Down chevron buttons replace drag handle
- **One-tap Movement**: Tap up/down to move property in list
- **Haptic Feedback**: Vibration on successful move (if supported)
- **Auto-save**: Saves after a short delay to allow multiple quick moves

#### Technical Details
```typescript
// Server action for updating order
updateClientPropertyOrder(clientId: string, propertyIds: string[])

// Updates position field for each property based on array index
// Example: ['prop-a', 'prop-c', 'prop-b'] → positions [0, 1, 2]
```

### 2. Bulk Select/Add/Remove

#### Bulk Mode Toggle
- **Button Location**: Top-right of "Available Properties" section
- **Visual State**: Blue button when active, outline when inactive
- **Icons**: CheckSquare when active, Square when inactive

#### Bulk Selection UI
- **Checkboxes**: Appear next to each available property when bulk mode active
- **Click Anywhere**: Can click entire property card to select/deselect
- **Visual Feedback**: Selected properties show blue ring and blue background tint
- **Selection Counter**: Shows "X Selected" in action buttons

#### Bulk Actions
1. **Select All**: Selects all currently visible/filtered properties
2. **Deselect All**: Clears all selections
3. **Add X Selected**: Opens pricing modal for bulk assignment
   - Choose pricing visibility options that apply to ALL selected properties
   - Confirms assignment count in toast notification
4. **Bulk Remove** (from assigned properties section):
   - Shows confirmation dialog with count
   - Removes all selected properties at once

#### Technical Details
```typescript
// Server actions for bulk operations
bulkAssignPropertiesToClient(
  clientId: string,
  propertyIds: string[],
  pricingOptions?: ClientPricingOptions
)

bulkRemovePropertiesFromClient(
  clientId: string,
  propertyIds: string[]
)

// Both return: { success: true, count: number } or { error: string }
```

## Code Changes

### New Files

1. **`scripts/add-position-to-client-assignments.js`**
   - Migration script for adding position field
   - Generates SQL for manual execution

### Modified Files

1. **`lib/actions/clients.ts`**

   **New Functions:**
   ```typescript
   // Reordering
   export async function updateClientPropertyOrder(
     clientId: string,
     propertyIds: string[]
   )

   // Bulk operations
   export async function bulkAssignPropertiesToClient(
     clientId: string,
     propertyIds: string[],
     pricingOptions?: ClientPricingOptions
   )

   export async function bulkRemovePropertiesFromClient(
     clientId: string,
     propertyIds: string[]
   )
   ```

   **Updated Functions:**
   ```typescript
   // Now includes position field
   assignPropertyToClient() // Gets max position and increments
   getClientPropertiesWithPricing() // Orders by position ASC
   ```

2. **`components/client-property-assignment.tsx`** (Complete Rewrite)

   **New State:**
   ```typescript
   // Drag and drop
   const [assignedProperties, setAssignedProperties] = useState<Property[]>([])
   const [dragIndex, setDragIndex] = useState<number | null>(null)
   const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
   const [dragDirection, setDragDirection] = useState<'up' | 'down' | null>(null)
   const [isSavingOrder, setIsSavingOrder] = useState(false)

   // Bulk selection
   const [selectedProperties, setSelectedProperties] = useState<Set<string>>(new Set())
   const [isBulkMode, setIsBulkMode] = useState(false)
   ```

   **New Handlers:**
   ```typescript
   // Drag and drop
   handleDragStart(index: number)
   handleDragOver(index: number)
   handleDragEnd()
   handleDrag(e: React.DragEvent) // Auto-scroll logic
   handleMoveUp(index: number) // Mobile
   handleMoveDown(index: number) // Mobile

   // Bulk operations
   toggleBulkMode()
   togglePropertySelection(propertyId: string)
   selectAll()
   deselectAll()
   handleBulkAdd()
   handleConfirmBulkAdd()
   handleBulkRemove()
   ```

   **UI Changes:**
   - Added GripVertical icon for desktop drag handle
   - Added ChevronUp/ChevronDown buttons for mobile
   - Added "Bulk Select" toggle button
   - Added checkboxes to property cards in bulk mode
   - Added "Select All" / "Deselect All" buttons
   - Added "Add X Selected" button
   - Updated pricing modal to handle bulk operations
   - Added visual indicators for dragging state
   - Added "Saving..." badge during order updates

## Usage Guide

### For Admins

#### Reordering Properties (Desktop)
1. Navigate to a client's detail page
2. In "{Client}'s Properties" section, hover over a property
3. Click and hold the grip handle (⋮⋮ icon) on the left
4. Drag the property up or down
5. Drop it in the desired position
6. Order is saved automatically
7. Toast confirmation appears

#### Reordering Properties (Mobile)
1. Navigate to a client's detail page
2. In "{Client}'s Properties" section, find a property
3. Tap the ▲ button to move up or ▼ button to move down
4. Property moves immediately with haptic feedback
5. Order is saved automatically after a short delay

#### Bulk Adding Properties
1. Navigate to a client's detail page
2. In "Available Properties" section, click "Bulk Select" button
3. Button turns blue and checkboxes appear
4. Click on properties or check boxes to select them
5. Click "Select All" to select all visible properties
6. Click "Add X Selected" button
7. Choose pricing visibility options (applies to all)
8. Click "Assign Properties"
9. Toast shows "{count} properties assigned to client"
10. Click "Bulk Select" again to exit bulk mode

#### Bulk Removing Properties
1. Enter bulk mode by clicking "Bulk Select"
2. Select properties you want to remove
3. Click "Remove X Selected"
4. Confirm the action in the dialog
5. Properties are removed immediately

### For Clients

Clients will see properties in the order you've arranged them:
- First property in your list appears first on their page
- Last property appears last
- Reordering updates their view immediately

## Technical Architecture

### Data Flow

```
User drags property
  ↓
handleDragOver() updates state
  ↓
Properties reorder visually
  ↓
handleDragEnd() calls updateClientPropertyOrder()
  ↓
Server updates position fields in database
  ↓
revalidatePath() refreshes data
  ↓
Toast confirms success
```

### Position Management

**Auto-increment on Add:**
```typescript
// When adding a property
const maxPosition = Math.max(...existingPositions)
newProperty.position = maxPosition + 1
```

**Reindex on Reorder:**
```typescript
// After drag-and-drop
propertyIds.forEach((id, index) => {
  updatePosition(id, index) // 0, 1, 2, 3, etc.
})
```

**Gap Tolerance:**
- System handles gaps in positions gracefully
- Sorting by position ASC ensures correct display order
- Reordering reindexes from 0 to eliminate gaps

### Performance Optimizations

1. **Debounced Reordering**: 50ms delay prevents jittery animations
2. **Optimistic UI Updates**: Properties reorder immediately, then save
3. **Batch Position Updates**: All positions updated in parallel with Promise.all()
4. **Auto-scroll**: Smooth scrolling when dragging near viewport edges
5. **Bulk Insert**: Single database insert for multiple properties

## Testing Checklist

### Database Migration
- [ ] Run SQL script in Supabase SQL Editor
- [ ] Verify `position` column exists
- [ ] Check that existing assignments have position values (0, 1, 2, etc.)
- [ ] Verify index was created

### Drag-and-Drop (Desktop)
- [ ] Can drag properties up and down
- [ ] Visual feedback shows during drag
- [ ] Drop zones highlight correctly
- [ ] Auto-scroll works near edges
- [ ] Order saves automatically
- [ ] Toast confirmation appears
- [ ] Order persists after page refresh
- [ ] Works with 2 properties
- [ ] Works with 10+ properties

### Drag-and-Drop (Mobile)
- [ ] Up/down arrow buttons appear
- [ ] Can move properties with buttons
- [ ] Haptic feedback works (if device supports)
- [ ] Top property can't move up
- [ ] Bottom property can't move down
- [ ] Order saves automatically
- [ ] Works smoothly with multiple quick taps

### Bulk Select
- [ ] "Bulk Select" button toggles mode
- [ ] Checkboxes appear when active
- [ ] Can click card or checkbox to select
- [ ] Selected properties show blue ring
- [ ] "Select All" selects visible properties
- [ ] "Deselect All" clears selections
- [ ] Counter shows correct number

### Bulk Add
- [ ] "Add X Selected" button appears with count
- [ ] Pricing modal opens with bulk message
- [ ] Selected properties are assigned
- [ ] Toast shows correct count
- [ ] Bulk mode exits after assignment
- [ ] Assignments appear in correct order
- [ ] Pricing options apply to all

### Bulk Remove
- [ ] Can select assigned properties
- [ ] "Remove X Selected" button works
- [ ] Confirmation dialog shows count
- [ ] All selected properties removed
- [ ] Toast confirms removal count

### Client View
- [ ] Properties appear in reordered sequence
- [ ] First property is first
- [ ] Last property is last
- [ ] Bulk-added properties appear at end
- [ ] Order persists across sessions

## Known Limitations

1. **No Undo**: Reordering is immediate and can't be undone (refresh to revert)
2. **No Multi-select on Assigned**: Can only bulk-select available properties
3. **Mobile Drag**: Native HTML5 drag doesn't work well on mobile, so arrow buttons used instead
4. **Browser Compatibility**: Requires modern browser with drag-and-drop API support

## Future Enhancements

### Potential Additions
1. **Undo/Redo**: Track order history and allow reverting changes
2. **Keyboard Shortcuts**: Alt+↑/↓ to move selected property
3. **Multi-select Assigned**: Bulk operations on assigned properties too
4. **Saved Views**: Save and switch between different orderings
5. **Auto-sort Options**: Sort alphabetically, by price, by date added, etc.
6. **Drag Between Clients**: Drag property from one client to another
7. **Bulk Pricing Edit**: Update pricing for multiple assigned properties at once
8. **Position Numbers**: Show position numbers on cards (1, 2, 3, etc.)

## Troubleshooting

### Properties Won't Drag (Desktop)
- Check browser console for errors
- Verify `draggable` attribute is on elements
- Ensure drag handlers are bound correctly
- Try hard refresh (Ctrl+Shift+R)

### Order Doesn't Save
- Check browser network tab for failed requests
- Verify position field exists in database
- Check server action logs for errors
- Ensure proper authentication

### Bulk Select Not Working
- Verify state management is working
- Check that Set is being updated correctly
- Ensure checkbox onChange is firing
- Check for JavaScript errors

### Mobile Buttons Not Appearing
- Check responsive CSS breakpoints
- Verify Tailwind's `md:` classes
- Test on actual mobile device (not just devtools)
- Check for conflicting CSS

## Support

### Common Issues

**Q: Can I reorder properties for multiple clients at once?**
A: No, reordering is per-client. Each client can have a different order.

**Q: Does reordering affect the properties list page?**
A: No, only affects the specific client's portfolio view.

**Q: Can clients reorder properties themselves?**
A: No, only admins can reorder. Clients see the order you set.

**Q: What happens if I add a property after reordering?**
A: New properties appear at the end of the list (highest position + 1).

**Q: Can I set a specific position number?**
A: Not in the UI, but you can update the database directly if needed.

### Debugging Commands

Check property positions in database:
```sql
SELECT
  c.name as client_name,
  p.address,
  cpa.position
FROM client_property_assignments cpa
JOIN clients c ON c.id = cpa.client_id
JOIN properties p ON p.id = cpa.property_id
WHERE c.id = 'client-uuid-here'
ORDER BY cpa.position;
```

Reset positions for a client:
```sql
WITH numbered AS (
  SELECT
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_position
  FROM client_property_assignments
  WHERE client_id = 'client-uuid-here'
)
UPDATE client_property_assignments cpa
SET position = numbered.new_position
FROM numbered
WHERE cpa.id = numbered.id;
```

## Credits

Implementation completed: December 2024
Features: Drag-and-drop reordering + Bulk select/add/remove
Based on: Existing properties-list drag-and-drop pattern
Compatible with: Custom URL slugs, Last accessed tracking, Client sharing
