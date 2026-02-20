# Enterprise Performance & INP Audit Guide

This document outlines the architectural solutions implemented to eliminate **Interaction to Next Paint (INP)** regressions and the methods for validating them.

## 1. Architectural Solutions Implemented

- **Main Thread Isolation**: 
  - Subscribed to `web-vitals` on app initialization.
  - Wrapped non-urgent state updates (`cart`, `language`) in `React.startTransition`.
- **State Bottleneck Elimination**:
  - Migrated real-time Supabase updates to a **Zustand Store** with selector-based subscriptions.
  - This prevents a change in "Products" from triggering a re-render of the entire `AppShell`.
- **Bundle Optimization**:
  - Implemented manual chunk splitting in `vite.config.ts` to isolate `react`, `supabase`, and UI libraries.
  - Enforced route-level code splitting using `React.lazy`.
- **Render containment**:
  - Applied `contain: layout` to `ProductCard` and other list items to prevent global layout recalculations.
- **Micro-tasks Scheduling**:
  - Prioritized user feedback (opening drawers) before processing background data transitions.

---

## 2. Validation Methods

### A. Chrome Performance Panel (INP Profiling)
1. Open DevTools > **Performance** tab.
2. Click the **Record** icon.
3. Rapidly interact with the UI (e.g., click "Add to Cart" multiple times, toggle language).
4. Stop recording.
5. Look for **Long Tasks** (red bars) in the Main thread.
6. Verify that the "Next Paint" happens within **200ms** of the interaction.
7. Check the **Interactions** row in the timeline to see specific INP durations.

### B. React Profiler (Re-render Audit)
1. Open DevTools > **Profiler** tab.
2. Click **Start Profiling**.
3. Toggle a state that previously caused a cascade (e.g., a real-time update mock).
4. Stop profiling.
5. Verify that **only the impacted components** re-render (colored bars), while the rest of the tree remains gray.

### C. Lighthouse CI (Assertion)
- The CI pipeline now asserts that **Total Blocking Time (TBT)** is < 200ms.
- Any PR that introduces a heavy synchronous script on the main thread will fail the build.

---

## 3. Production Validation Checklist

- [ ] Open app on a mid-range mobile device.
- [ ] Connect to Chrome Remote Debugging.
- [ ] Toggle various interactions while checking the `[Performance]` logs in the console.
- [ ] Verify that no `[Interaction]` log shows a duration > 200ms.
- [ ] Check the telemetry endpoint to ensure production metrics are being reported correctly.

---

## 4. Best Practices for Future Feature Development

1. **Never block the click**: If a handler takes > 50ms, move logic to an effect or `requestIdleCallback`.
2. **Selector Subscriptions**: Never do `const state = useStore()`. Always use `const data = useStore(s => s.data)`.
3. **Layout Containment**: Use `.contain-layout` for any component that iterates over data.
4. **Memoize by Default**: Any component taking objects/arrays as props must be wrapped in `React.memo`.
