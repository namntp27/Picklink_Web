# Design System: Picklink White Lime

## 1. Visual Theme & Atmosphere

Picklink is a bright, clean court-booking web app. The interface should feel
modern, breathable, and operational: fast to scan, easy to trust, and clearly
connected to pickleball without bathing every surface in green.

- **Density:** 6/10. Booking and management screens may be compact, but the
  background remains clean and white.
- **Variance:** 6/10. Use controlled asymmetric grids for home, list-map, and
  receipt layouts. Avoid centered marketing blocks when a workflow is present.
- **Motion:** 5/10. Short tactile feedback, no decorative loops.
- **Color philosophy:** White is the dominant color. `#98D951` is the single
  accent hue for CTA, active state, focus, selected controls, and key icons.
- **No pale green canvas:** Do not use `#F7FAEA`, `#F8FBEB`, or similar green
  tinted backgrounds as the app canvas. Green appears as action, not wallpaper.
- **Content integrity:** Preserve Vietnamese copy, routes, validation,
  authentication behavior, booking logic, realtime updates, and map behavior.

## 2. Color Palette & Roles

Use one accent hue and a synchronized neutral surface system.

- **App White** (`#FFFFFF`) - Primary page background, header, cards, panels.
- **Soft White** (`#FAFBF8`) - Subtle alternate bands and hover foundations.
- **Field White** (`#F6F8F3`) - Inputs, filter bars, selected row base.
- **Pressed Neutral** (`#EEF2E8`) - Hovered rows, muted pills, skeleton blocks.
- **Line Neutral** (`#DDE5D5`) - Borders, dividers, table rules.
- **Deep Line** (`#9CA691`) - Higher-emphasis borders and disabled outlines.
- **Ink Charcoal** (`#161A12`) - Primary text. Never use pure black.
- **Muted Olive** (`#596151`) - Secondary text, helper copy, metadata.
- **Action Lime** (`#98D951`) - The only accent color: primary CTA fill,
  active state, focus rings, selected controls, icon emphasis.
- **Action Ink** (`#17310A`) - Text placed on Action Lime.
- **Readable Green** (`#477313`) - Accessible green text/link shade derived
  from the accent hue. Use only when lime text would fail contrast.
- **Night Court** (`#1F241B`) - Footer and inverse surfaces.
- **Error Red** (`#BA1A1A`) - Destructive and failed states only.

Secondary and tertiary token names may exist for compatibility, but they must
resolve to neutral values or the same lime hue. Do not introduce teal, purple,
blue, or pink as app accents.

## 3. Typography Rules

- **Display:** Be Vietnam Pro, 700 weight, controlled `clamp()` scale, tight
  tracking no lower than `-0.03em`.
- **Headings:** Be Vietnam Pro, 600-700 weight. Use placement and weight before
  making text huge.
- **Body:** Be Vietnam Pro, 400-600 weight, relaxed line-height, max `65ch`.
- **Metadata:** Be Vietnam Pro, 500-600 weight. Use muted neutral text.
- **Minimums:** Body copy at least `14px`; touch labels at least `13px`.
- **Banned:** Inter, generic serif fonts, pure system-font hierarchy,
  all-caps paragraphs, and oversized marketing headlines.

## 4. Component Stylings

- **Header:** Fixed 72px white command bar with neutral border and compact pill
  rails. Active nav uses Action Lime with Action Ink or a lime left/accent
  indicator. Mobile menu is a white sheet with grouped links.
- **Buttons:** Rounded `8px`, minimum `44px`, compact padding. Primary buttons
  use Action Lime (`#98D951`) with Action Ink (`#17310A`). Hover moves `-1px`
  and uses a slightly quieter lime shadow. Active presses `1px` and scales to
  `0.99`. No bulky borders, no neon glow.
- **Inputs:** `48px` height, Field White fill, Line Neutral border. Focus uses
  a `#98D951` border/ring and never moves labels or helper text.
- **Cards and panels:** White surface, Line Neutral border, soft neutral shadow
  only where hierarchy needs it. Avoid nested cards; use dividers in dense
  booking, timeline, and venue-list areas.
- **Badges:** Neutral badges by default. Active/positive badges may use
  translucent Action Lime and Action Ink. Error badges use Error Red.
- **Map markers:** Use Action Lime for normal venue pins and Readable Green for
  selected/deeper states. Location markers must not introduce blue or teal.
- **Images:** Keep real court/tournament imagery in fixed-ratio containers with
  `overflow:hidden`. Hover may transform-scale to `1.03-1.05`; containers do
  not resize.
- **Loading:** Prefer skeleton rows matching layout dimensions. Use circular
  spinners only for full-page blocking loads.

## 5. Layout Principles

- Use CSS Grid for page architecture.
- Contain normal pages at `1280px`; map-heavy pages may extend to `1440px`.
- White is the dominant surface. Use Soft White/Field White to separate zones,
  not green background washes.
- Home uses a bright workflow hero and asymmetric content grids.
- BookCourt uses a compact hero, filter band, and list-map split. Desktop map
  is sticky; mobile collapses to one column.
- BookingDetail uses a receipt-like layout: identity band, facts, timeline,
  and action/cost rail.
- Full-height layouts use `min-height: 100dvh`, never fixed `h-screen`.

## 6. Responsive Rules

- Below `768px`, all multi-column layouts collapse to one column.
- No horizontal scrolling at any viewport.
- Headings scale with `clamp()` and stay at or below `32px` on mobile.
- Header labels collapse before spacing becomes cramped.
- Map frames keep stable height: about `420px` on mobile and viewport-aware
  height on desktop.
- Touch targets are at least `44px`; key booking actions are at least `48px`.

## 7. Motion & Interaction

- Default transition: `200ms cubic-bezier(0.2, 0.8, 0.2, 1)`.
- Animate `transform`, `opacity`, color, border, and shadow only.
- Hover, focus, active, loading, and selected states must not cause layout
  shift.
- Focus is always visible through the Action Lime ring.
- Respect `prefers-reduced-motion`; remove transforms and repeated animation
  when reduction is requested.

## 8. Screen-Specific Direction

- **Header:** white command bar, compact grouped nav, Action Lime active cue.
- **Home:** bright hero with white/lime composition. The booking search is the
  first workflow; imagery supports the sport without darkening the app.
- **BookCourt:** scan-first list-map tool. Venue rows expose name, address,
  rating, hours, distance, price, and "Chon san" without nested-card clutter.
- **BookingDetail:** booking code, venue, schedule, payment state, and next
  action must be visible immediately. Timeline rows use dividers and icons.

## 9. Anti-Patterns (Banned)

- No `#F7FAEA`, `#F8FBEB`, or similar pale green canvas backgrounds.
- No emojis, pure black (`#000000`), neon/outer glow shadows, decorative
  purple/blue gradients, custom cursors, or broken remote image links.
- No second accent colors such as teal, purple, pink, or blue for app UI.
- No Inter, generic serif fonts, oversized marketing headlines, or all-caps
  paragraph copy.
- No overlapping elements, absolute-positioned text stacks, or text over media
  without a legible layer.
- No generic three-equal-card feature rows or nested cards inside cards.
- No fabricated statistics, testimonials, response times, uptime claims, or
  fake round numbers.
- No filler instructions such as "Scroll to explore", bouncing chevrons, or
  scroll arrows.
- No motion that changes layout, runs forever for decoration, or ignores
  reduced-motion preferences.
