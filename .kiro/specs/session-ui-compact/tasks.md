# Implementation Tasks — Training Session UI Compact Redesign

## Task 1: NumberStepper component ✅
- [x] 1.1 Create `src/modules/session/ui/components/number-stepper.tsx`

## Task 2: Integrate NumberStepper into ExerciseSets ✅
- [x] 2.1 Replace reps `<Input>` with `<NumberStepper>`
- [x] 2.2 Replace weight `<Input>` with `<NumberStepper>`
- [x] 2.3 Remove unused imports (`Input`, `FormControl`, `FormLabel`, `FormMessage`)
- [x] 2.4 Remove inline `compare`/`deltaClass` from ExerciseSets (now in NumberStepper)
- [x] 2.5 Simplified set row layout: header row (badge + done + rest + delete) + stepper row (grid-cols-2)

## Task 3: SwipeableExerciseNav + ExerciseProgressDots (mobile) ✅
- [x] 3.1 Create `exercise-progress-dots.tsx`
- [x] 3.2 Create `swipeable-exercise-nav.tsx` (scroll-snap + IntersectionObserver)
- [x] 3.3 Create `use-media-query.ts` hook
- [x] 3.4 Wire into `StrengthSessionView` with conditional rendering + auto-advance
- [x] 3.5 Extract `ExerciseCard` component to share between mobile/desktop
- [x] 3.6 Add `no-scrollbar` CSS utility to globals.css

## Task 4: ExerciseSidebar (desktop) ✅
- [x] 4.1 Create `exercise-sidebar.tsx` (sticky nav, completion icons, click handler)
- [x] 4.2 Wrap desktop layout in `flex gap-6` with sidebar + content
- [x] 4.3 Add `exerciseRefs` for `scrollIntoView` on sidebar click

## Task 5: Keyboard shortcuts (desktop) ✅
- [x] 5.1 Create `use-session-keyboard-shortcuts.ts` (Enter, ArrowLeft/Right)
- [x] 5.2 Wire into view with custom event dispatch for toggle-done
- [x] 5.3 Add event listener in `ExerciseSets` for `session:toggle-next-done`

## Task 6: Polish & responsive testing
- [ ] 6.1 Smooth transitions between breakpoints — no layout jumps when resizing
- [ ] 6.2 Test swipe container performance with 8+ exercises (no jank)
- [ ] 6.3 Verify auto-save, session resume, form submission all still work with new UI
- [ ] 6.4 Verify done-state, rest timer, progress tracking unaffected
- [ ] 6.5 Check accessibility: screen reader navigation, focus management, aria attributes
- [ ] 6.6 Test on iOS Safari, Android Chrome, desktop Chrome/Firefox/Safari
