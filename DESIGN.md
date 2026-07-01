# Design System: Picklink Athletic Clarity

> **Canonical preview:** All future login design edits must overwrite
> `.stitch/designs/picklink-login-final.html`. Do not create numbered design
> variants unless the user explicitly requests variants again.

## 1. Visual Theme & Atmosphere

Picklink should feel like a well-run modern pickleball club: energetic without
being noisy, precise without becoming sterile, and social without looking
playful or childish.

- **Density:** 5/10 — balanced daily-app density with clear scanning lanes.
- **Variance:** 6/10 — controlled asymmetry, typically a 55/45 or 60/40 split.
- **Motion:** 5/10 — restrained, tactile micro-motion that confirms actions.
- **Hierarchy:** Use spacing, alignment, weight, and contrast before adding
  containers or decoration.
- **Emphasis:** Brand wordmarks, hero keywords, and primary form headings may
  use a restrained Court Green text glow and one-step type-size increase.
  Body copy, labels, placeholders, and utility links never glow.
- **Signature glow requirement:** Every page must contain exactly one prominent
  phrase with the same luminous treatment as the login-page phrase “sân đấu”.
  Select a meaningful phrase of one to four words from the page's existing
  heading or primary message; never invent filler copy solely for the effect.
  The phrase is a visual anchor, not decoration repeated throughout the page.
- **Signature glow styling:** Use an 800 font weight, increase the phrase by
  approximately 10–15% relative to its surrounding heading, and apply the
  Court Green accent with a short-radius lime text shadow. Keep the glow soft
  and readable rather than neon. On light surfaces, use a darker Court Green
  foreground with the lime glow; on dark surfaces, the brighter lime foreground
  is allowed.
- **Responsive behavior:** Scale signature-glow text with `clamp()` and cap it
  at 32px on mobile. It must wrap as a coherent phrase, never overflow, overlap,
  or create horizontal scrolling.
- **Content integrity:** Preserve all current Vietnamese copy, controls,
  destinations, validation behavior, and authentication flows.

## 2. Color Palette & Roles

- **Clubhouse Canvas** (`#F7F8F3`) — page background and quiet breathing space.
- **Pure Surface** (`#FFFFFF`) — forms and elevated functional surfaces.
- **Carbon Ink** (`#171A16`) — primary headings and body copy; never pure black.
- **Muted Court Line** (`#60665C`) — secondary copy and metadata.
- **Whisper Sage Border** (`#D8DED1`) — structural outlines and dividers.
- **Court Green** (`#3D6A00`) — the single brand accent for primary actions,
  links, selected states, and focus indicators.
- **Error Red** (`#B42318`) — semantic validation and failure feedback only.

Use tonal opacity or color mixing from Court Green for hover, pressed, and
subtle background states. Do not introduce an unrelated second accent.

## 3. Typography Rules

- **Display and headings:** Be Vietnam Pro, 600–700 weight, tight tracking,
  controlled responsive scale via `clamp()`.
- **Body and labels:** Be Vietnam Pro, 400–600 weight, relaxed line height.
- **Metadata:** Be Vietnam Pro, 500 weight. Do not add a decorative font.
- **Reading width:** Body copy must remain within 65 characters per line.
- **Minimum size:** Body copy is at least 14px; form labels are at least 14px.
- **Banned:** Inter, generic serif fonts, all-caps paragraphs, oversized
  marketing headlines, and hierarchy created only through font size.

## 4. Component Stylings

- **Primary buttons:** Minimum 48px height, gently rounded corners, Court Green
  fill, high-contrast label, stable width in every state.
- **Secondary buttons:** Pure Surface fill with a Whisper Sage Border; no outer
  glow and no heavy shadow.
- **Button states:** Hover uses a one-pixel visual lift and tonal darkening;
  focus-visible uses a clear three-pixel Court Green ring with offset; active
  uses a one-pixel tactile press and `scale(0.99)`; disabled lowers contrast
  while preserving legibility.
- **Button interaction values:** Match the canonical login preview. Use a
  `200ms cubic-bezier(0.2, 0.8, 0.2, 1)` transition. Hover applies
  `translateY(-1px)` with a subtle tonal change. Active applies
  `translateY(1px) scale(0.99)`. Keyboard focus uses a 3px Court Green outline
  at approximately 72% opacity with a 3px offset. Disabled controls use
  `opacity: 0.55` and `cursor: not-allowed`.
- **Loading buttons:** Replace the leading icon with a fixed-size inline
  progress indicator or three-dot pulse while keeping the button label, width,
  height, and surrounding layout fixed.
- **Inputs:** Persistent label above; helper or error text below. Minimum 48px
  field height. Focus changes border and adds an unobtrusive focus ring.
- **Input focus interaction:** Clicking, tapping, or keyboard-focusing an input
  changes its border to Court Green and adds a soft one-pixel Court Green focus
  ring. Transition border, ring, and background color over 200ms. Inputs never
  scale, jump, change dimensions, or move nearby labels and helper text.
- **Checkboxes and icon buttons:** Minimum 44px tap target even when the visual
  glyph is smaller.
- **Forms:** Errors appear inline near the affected field, with an optional
  summary alert above the form. Never rely on color alone.
- **Cards:** Use only when elevation communicates hierarchy. Prefer tonal
  sections, whitespace, or a single border over nested cards.
- **Images and illustrations:** Pickleball visuals must support the task and
  preserve text legibility. Avoid stock-photo collage and broken remote assets.
- **Image hover interaction:** Place hoverable images inside a fixed-size
  `overflow: hidden` container. On pointer hover, scale the image to
  `1.03–1.05` over 200ms using
  `cubic-bezier(0.2, 0.8, 0.2, 1)`. When the pointer leaves, transition smoothly
  back to `scale(1)`. Animate the image with `transform` only; never resize its
  container, change surrounding spacing, or cause layout shift.
- **Image behavior safeguards:** Use `object-fit: cover` and preserve the
  container's existing corner radius. Do not apply hover zoom to logos, icons,
  QR codes, maps, diagrams, or images whose edges contain essential
  information. Disable the scaling transform when
  `prefers-reduced-motion: reduce` is active.

## 5. Layout Principles

- Use a contained CSS Grid with a maximum width of 1280px.
- Desktop authentication layouts may use a controlled asymmetric split; the
  form remains the strongest scanning anchor.
- Keep each content group in its own spatial zone. No overlapping text, images,
  controls, or absolute-positioned content stacks.
- Use an eight-pixel rhythm with 16px mobile margins and at least 24px desktop
  gutters.
- Maintain a clear scan path: brand → page title → fields → support options →
  primary action → alternate authentication → account navigation.
- Full-height layouts use `min-height: 100dvh`, never a fixed viewport height.
- Avoid unnecessary scrolling at common desktop heights, but never compress
  form controls below accessible dimensions.

## 6. Responsive Rules

- Below 768px, all multi-column layouts collapse to one column.
- No horizontal scrolling at any viewport.
- Decorative hero media becomes a compact in-flow banner or a restrained
  background region; it must not push the form below the primary viewport.
- Navigation actions simplify but remain discoverable.
- Footer links wrap cleanly and retain 44px touch targets.
- Headings scale with `clamp()` and never exceed 32px on mobile.
- Inputs, labels, validation messages, and keyboard focus remain visible when
  the virtual keyboard is open.

## 7. Motion & Interaction

- Use 180–220ms transitions with a weighty ease such as
  `cubic-bezier(0.2, 0.8, 0.2, 1)`.
- **Important-text hover:** The page's signature-glow phrase and other
  explicitly designated important headings respond to pointer hover by
  increasing the lime text-shadow slightly and lifting no more than one pixel.
  The response uses the same 200ms weighted easing as the canonical login page.
  Do not change font size, weight, line height, or letter spacing on hover, so
  surrounding content never shifts.
- **Important-text active/focus:** If the emphasized text is also a link or
  button, active state presses down one pixel and focus-visible receives the
  standard three-pixel Court Green outline with offset. Decorative,
  non-clickable headings keep the default cursor and must not imitate a button.
- **Canonical control behavior:** Buttons, links, icon buttons, checkboxes, and
  form fields should reproduce the hover, focus-visible, active, disabled, and
  loading behavior defined in
  `.stitch/designs/picklink-login-final.html`.
- Animate primarily with `transform` and `opacity`; color and border transitions
  may be used for control-state feedback, and `text-shadow` may transition only
  on the designated signature-glow phrase.
- Hover, focus, active, and loading states must not cause layout shift.
- Entry motion is optional and limited to a short staggered fade/translate of
  the page title and form groups.
- Respect `prefers-reduced-motion`; remove transforms and repeated motion when
  reduction is requested.
- Do not run perpetual decorative loops. Loading motion may repeat only while
  an operation is actually pending.

## 8. Variant Guardrails

Three comparison concepts may vary layout balance, hero treatment, information
grouping, and tonal emphasis. They must preserve the same content, form fields,
links, authentication methods, validation states, and responsive behavior.

## 9. Anti-Patterns (Banned)

- No emojis, pure black, purple/neon accents, or gradient headline text.
- No broad neon glow. A short-radius, low-opacity Court Green text shadow is
  allowed for the page's single signature phrase, the wordmark, and—when
  necessary—the primary form heading at a visibly lower intensity.
- Never apply the signature glow to paragraphs, form labels, placeholders,
  helper text, table cells, metadata, footer links, or button labels.
- No excessive rounded cards, floating glass panels, or generic SaaS styling.
- No overlapping elements, custom cursors, or three-equal-card feature rows.
- No fabricated statistics, testimonials, metrics, or navigation destinations.
- No AI copywriting clichés, filler instructions, or English replacement copy.
- No broken remote images or decorative media that competes with the form.
- No motion that changes layout, animates width/height, or ignores reduced
  motion preferences.
