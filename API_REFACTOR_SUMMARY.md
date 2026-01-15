# API Client Refactoring Summary

Consistent use of `apiCall` across the client application and correct handling of the `/api` prefix.

## Key Changes

### 1. Centralized API Calls
Replaced all instances of direct `fetch` calls with the centralized `apiCall` function in the following components:
- `client/app/maintenance/cycles/page.tsx`
- `client/app/vehicles/page.tsx`
- `client/components/base-operation-chart.tsx`
- `client/components/enhanced-operation-chart.tsx`
- `client/components/file-upload.tsx`
- `client/components/inspection-plan-form.tsx`
- `client/components/inspection-plan-list.tsx`
- `client/components/maintenance-base-dates-manager.tsx`
- `client/components/maintenance-cycle-manager.tsx`
- `client/components/operation-plan-chart.tsx`
- `client/components/operation-planning-chart.tsx`
- `client/components/operation-planning.tsx`
- `client/components/vehicle-form.tsx`
- `client/components/vehicle-list.tsx`

### 2. Base URL Handling
- Exported `API_BASE_URL` from `client/lib/api-client.ts`.
- Removed the manual `/api` prefix from all `apiCall` endpoint arguments.
- Updated `fetch` calls for non-JSON responses (e.g., Blobs for CSV export) to use `API_BASE_URL` for absolute URL construction.

### 3. Bug Fixes
- **Variable Shadowing**: Fixed issues in `OperationPlanChart` and `OperationPlanningChart` where local variables were incorrectly shadowing state variables, causing data fetching failures.
- **Double Catch**: Removed a redundant double `catch` block in `client/components/file-upload.tsx`.

## Verification
- Verified that no `apiCall("/api/...")` or `fetch("/api/...")` calls remain in the codebase.
- Verified that all components now consistently use the centralized API client logic.
