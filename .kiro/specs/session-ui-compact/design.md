# Training Session UI — Compact & Interactive Redesign

## Overview

The current training session page uses raw number inputs and a vertical scroll layout for all exercises. This works, but has friction points:
- On mobile, tapping a number input opens the full keyboard — slow for small adjustments like +1 rep or +2.5kg
- Scrolling through many exercises vertically loses context on where you are in the workout
- On desktop, the single-column layout wastes horizontal space

This design introduces three targeted improvements:
1. **Inline number steppers** — replace raw inputs with -/+ tap controls for reps and weight
2. **Swipeable exercise cards (mobile)** — one exercise at a time with swipe navigation
3. **Exercise sidebar rail (desktop)** — persistent overview panel for orientation and quick jumping

All changes are additive and preserve the existing data model, auto-save, and form validation.

---

## Architecture

### High-Level Component Tree (After)

```
StrengthSessionView
├── Header (sticky — unchanged)
├── Alert (resuming/history — unchanged)
├── Form
│   ├── [mobile] SwipeableExerciseNav        ← NEW wrapper
│   │   ├── ExerciseProgressDots             ← NEW indicator
│   │   └── ExerciseCard (one visible at a time)
│   │       └── ExerciseSets
│   │           └── SetRow
│   │               ├── NumberStepper (reps)  ← NEW
│   │               └── NumberStepper (weight) ← NEW
│   ├── [desktop] ExerciseSidebar             ← NEW panel
│   │   └── ExerciseNavItem (per exercise)
│   └── [desktop] ExerciseList (vertical scroll — current behavior, improved)
│       └── ExerciseCard
│           └── ExerciseSets → SetRow → NumberStepper
├── Complete button (sticky bottom — unchanged)
└── SessionSummaryDialog (unchanged)
```

### Responsive Strategy

| Breakpoint | Layout |
|------------|--------|
| `< sm` (mobile) | Swipeable single-exercise view + progress dots |
| `≥ sm` and `< lg` (tablet) | Vertical scroll (current), inline steppers |
| `≥ lg` (desktop) | Sidebar rail + vertical scroll + inline steppers + keyboard shortcuts |

Detection uses Tailwind responsive classes and a `useMediaQuery` hook for JS-driven swipe behavior.

---

## Components and Interfaces

### 1. NumberStepper

Replaces raw `<Input type="number">` for reps and weight fields.

```tsx
interface NumberStepperProps {
  value: number | null | undefined;
  onChange: (value: number | null) => void;
  min?: number;
  step?: number;           // default 1 for reps, configurable for weight
  disabled?: boolean;
  label?: string;          // "Reps" or "Weight"
  previousValue?: number;  // for delta coloring
  placeholder?: string;
  inputMode?: "numeric" | "decimal";
}
```

**Behavior:**
- Displays current value in a centered read-only-style field
- `-` button on left, `+` button on right
- Tap `-`/`+` adjusts by `step` amount
- Long-press (300ms threshold) enters rapid-fire mode: increments every 100ms
- Tap the center value to open native keyboard for direct entry (falls back to editable input)
- Preserves existing delta coloring (green/red border based on comparison to previous session)
- When `disabled` (set marked done), buttons are grayed out

**Step values:**
- Reps: step = 1, min = 1
- Weight: step = 2.5 (default, configurable), min = 0

**Visual Design:**
```
┌─────────────────────────┐
│  [ - ]   12   [ + ]     │  ← compact row, h-10
│          prev: 10       │  ← previous value hint
└─────────────────────────┘
```

Buttons are `h-10 w-10` touch targets (44px effective with padding) meeting WCAG minimum.

### 2. SwipeableExerciseNav (mobile only)

Wraps exercise cards for horizontal swipe navigation on mobile.

```tsx
interface SwipeableExerciseNavProps {
  children: React.ReactNode[];     // ExerciseCard elements
  activeIndex: number;             // from parent's activeExerciseIndex
  onIndexChange: (index: number) => void;
  exerciseNames: string[];         // for progress indicator
  progressByExercise: Record<number, { done: number; total: number }>;
}
```

**Implementation approach:**
- Uses CSS `scroll-snap-type: x mandatory` with `scroll-snap-align: center` on each child
- Each exercise card gets `min-w-full` so only one is visible
- A horizontal scroll container with `overflow-x: auto` and `-webkit-overflow-scrolling: touch`
- `IntersectionObserver` detects which card is in view and updates `activeIndex`
- No external swipe library needed — native scroll snap is well-supported (iOS 15+, all modern browsers)

**Why scroll-snap over a gesture library:**
- Zero bundle size impact
- Native momentum scrolling on iOS
- Accessible — works with keyboard arrow keys
- No conflict with vertical page scroll

**Progress Indicator (ExerciseProgressDots):**
```
    ● ● ○ ○ ○        ← dots at top
   Bench Press (2/4)  ← current exercise name + set progress
```
- Filled dot = exercise with all sets done
- Current dot = slightly larger / highlighted
- Empty dot = not yet started
- Tapping a dot jumps to that exercise

### 3. ExerciseSidebar (desktop only, ≥ lg)

Persistent left-side panel showing exercise overview.

```tsx
interface ExerciseSidebarProps {
  exercises: Array<{ name: string; position: number }>;
  progressByExercise: Record<number, { done: number; total: number }>;
  activeExerciseIndex: number | null;
  onExerciseClick: (index: number) => void;
}
```

**Layout:**
```
┌──────────────┬──────────────────────────────┐
│  Exercises   │  [Current exercise card]     │
│              │                              │
│  ✓ Bench     │  Set 1:  [-] 12 [+]  ...    │
│  ● Squat     │  Set 2:  [-] 10 [+]  ...    │
│  ○ Rows      │                              │
│  ○ Curls     │  [Add set]                   │
│              │                              │
│              │  [Next exercise cards...]     │
└──────────────┴──────────────────────────────┘
```

- Width: `w-48` fixed
- Sticky: `sticky top-32` (below header)
- Each item shows: exercise name, completion badge (✓ done, ● active, ○ pending)
- Click scrolls to exercise via `scrollIntoView({ behavior: "smooth" })`
- Active exercise is highlighted with `bg-accent`

### 4. Keyboard Shortcuts (desktop)

Registered via `useEffect` with `keydown` listener on the form container.

| Shortcut | Action |
|----------|--------|
| `Enter` | Toggle "Done" on next incomplete set of active exercise |
| `↑` / `↓` | Navigate between sets within active exercise |
| `←` / `→` | Navigate between exercises (scroll into view) |

Shortcuts are only active when no input is focused (check `document.activeElement`).

---

## Data Models

No changes to existing data models. All improvements are purely presentational.

The existing types remain as-is:
- `StrengthSessionFormValues` (form state)
- `InProgressSession` (auto-save persistence)
- `trainingSession`, `trainingSessionExercise`, `trainingSessionSet` (DB schema)

### New Client-Side State

```tsx
// In StrengthSessionView
const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
// On mobile: drives which card is visible in the swipe container
// On desktop: drives sidebar highlight (synced from scroll position)

// Weight step preference (could later be persisted)
const weightStep = 2.5; // kg — hardcoded initially
```

---

## Error Handling

- **NumberStepper bounds:** Clamped to `min`/`max`. Pressing `-` at min value is a no-op (button visually disabled).
- **Swipe edge cases:** At first/last exercise, scroll naturally stops (no overscroll action needed).
- **Direct input validation:** When tapping the center number to type directly, the same Zod validation applies on blur. Invalid input reverts to previous value.
- **Keyboard shortcut conflicts:** Shortcuts are suppressed when an input/textarea is focused, preventing interference with typing.
- **Scroll-snap browser fallback:** If CSS scroll-snap is unsupported (very old browsers), the container degrades to a regular horizontal scroll — functional but without snapping. No JS fallback needed.

---

## Testing Strategy

### Unit Tests
- `NumberStepper`: increment/decrement, clamping at min/max, long-press rapid fire, delta coloring classes
- `ExerciseProgressDots`: correct dot states based on progress data, tap handler calls onIndexChange

### Integration Tests
- Full session form with steppers: verify form values update correctly when using +/- buttons
- Swipeable nav: verify `currentExerciseIndex` updates on scroll (can mock IntersectionObserver)
- Auto-save still fires after stepper changes (regression)

### Manual / E2E Tests
- Mobile Safari & Chrome: swipe between exercises, verify momentum and snap behavior
- Desktop: sidebar click-to-scroll, keyboard shortcuts
- Tablet: verify vertical scroll layout (no swipe, no sidebar)
- Screen reader: stepper buttons have proper aria-labels (`"Decrease reps"`, `"Increase reps"`)

### Accessibility Checklist
- [ ] NumberStepper buttons: `aria-label`, minimum 44px touch target
- [ ] Swipe container: `role="tablist"` with `role="tabpanel"` per exercise
- [ ] Sidebar items: `role="navigation"` with active item `aria-current="true"`
- [ ] Keyboard shortcuts documented in a help tooltip (? icon)

---

## Implementation Plan

### Task 1: NumberStepper component
Create `src/modules/session/ui/components/number-stepper.tsx` with -/+ buttons, long-press support, tap-to-edit, and delta coloring. Write unit tests.

### Task 2: Integrate NumberStepper into ExerciseSets
Replace the reps and weight `<Input>` fields in `ExerciseSets` with `<NumberStepper>`. Ensure form values, auto-save, and done-state disabling all work correctly.

### Task 3: SwipeableExerciseNav + ExerciseProgressDots (mobile)
Create the scroll-snap container and progress dots. Wrap exercise cards in the swipeable nav on mobile (hidden on `sm:` and above). Wire up `currentExerciseIndex` state.

### Task 4: ExerciseSidebar (desktop)
Create the sidebar rail component. Add a `lg:` grid layout to the form area: `grid-cols-[12rem_1fr]`. Wire click-to-scroll and scroll-position sync.

### Task 5: Keyboard shortcuts
Add `useSessionKeyboardShortcuts` hook with Enter/arrow key handlers. Bind to form container. Add small help indicator.

### Task 6: Polish & responsive testing
- Ensure smooth transitions between breakpoints
- Test on real iOS Safari, Android Chrome
- Verify no regressions in auto-save, session resume, or form submission
- Performance check: swipe container with 8+ exercises
