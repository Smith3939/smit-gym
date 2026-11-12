# Smit Gym interface

Smit Gym is a Hebrew RTL fitness app. The existing light sport theme in
`docs/DESIGN_PROMPT.md` remains the visual authority. This pass refines that
implementation rather than replacing the brand.

## Mobile comes first

The primary use is on a phone, including during a workout. Work at 320–430px
first. Use one vertical scroll surface, readable inputs (16px), and controls
at least 44px tall. Keep the six existing destinations in the bottom navigation;
the selected destination has a soft brand fill and the bar hides for the keyboard.

On wider browsers the app is centered in a 760px frame. Authentication uses a
440px column. These are maximum widths; phones use the available width with
16px outer gutters. Grids follow the available content width and must survive
orientation changes. Home quick access uses two columns below 360px, three above.

## Visual language

- A quiet light background with white surfaces. Preserve the category colors:
  pink/red for workouts, green for nutrition, blue for water, purple for community
  and AI, amber for energy.
- Reserve the darker brand red for white-text actions and selected navigation.
  The brighter colors remain useful in rings, icons and data fills.
- Muted copy must remain legible against both white and the page background.
- The shared spacing and typography scales live in `src/config/theme.js`.
  Keep the established rounded sport cards. Prefer a single border or a shadow.
- Home gives the workout destination a clear action before the activity summary.
  Keep existing data and product behavior; this pass does not connect dashboard
  placeholders to live tracking.

## Forms and interaction

Authentication shares `AuthShell`: a compact brand, right-aligned heading,
persistent labels, neutral input surfaces, a clear primary action and a quieter
secondary action. Email text runs LTR. Password visibility is a named 44px control.
Forms scroll on short viewports and use safe-area insets and keyboard avoidance.

Show content immediately rather than using decorative entrance choreography in
shared cards. Preserve press feedback and state transitions. Keyboard focus,
selection and caret use the existing brand red. Hover is supplementary and only
applies where a pointer is available.

## Verification

Check login, registration and password reset at 320px and 390px, the home summary
and six-tab navigation at those widths, and a wide browser. Confirm no horizontal
overflow, that the bottom of longer forms remains reachable by scrolling, that
password visibility preserves the value, and that fields and actions have names.
Home visual fixtures must be identified as sample data and remain local.
