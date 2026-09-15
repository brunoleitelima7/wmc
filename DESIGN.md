---
name: Wildfire Media Coverage
description: A night newsroom for the public record of US wildfire — hairline-ruled, motionless, lit by a single ember.
colors:
  ink: "#0D0E0F"
  surface-raised: "#121315"
  surface-card: "#1B1E21"
  rule: "#2A2D30"
  rule-strong: "#4A4E52"
  paper: "#F2EFEA"
  paper-dim: "#BDB7AF"
  muted: "#9E9891"
  ember: "#E8613C"
  ember-bright: "#F4835F"
  ember-deep: "#C0301A"
typography:
  display:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(58px, 15cqw, 232px)"
    fontWeight: 400
    lineHeight: 0.82
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(34px, 5cqw, 78px)"
    fontWeight: 400
    lineHeight: 1.06
    letterSpacing: "normal"
  title:
    fontFamily: "Playfair Display, Georgia, serif"
    fontSize: "clamp(28px, 3.4cqw, 50px)"
    fontWeight: 400
    lineHeight: 1.12
    letterSpacing: "normal"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(15px, 1.15cqw, 17px)"
    fontWeight: 400
    lineHeight: 1.7
    letterSpacing: "normal"
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "clamp(11px, 0.8cqw, 12px)"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.2em"
rounded:
  none: "0"
spacing:
  hairline: "1px"
  xs: "8px"
  sm: "clamp(10px, 1.6cqw, 26px)"
  md: "clamp(20px, 4cqw, 72px)"
  lg: "clamp(56px, 7cqw, 120px)"
  xl: "clamp(72px, 9cqw, 168px)"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "0 clamp(16px, 1.6cqw, 26px)"
    height: "46px"
  button-primary-hover:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.ember-bright}"
  nav-link:
    textColor: "{colors.paper}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    height: "44px"
  nav-link-hover:
    textColor: "{colors.ember-bright}"
  nav-link-current:
    textColor: "{colors.ember}"
  card-record:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.none}"
    padding: "clamp(20px, 2.4cqw, 34px) 0"
---

# Design System: Wildfire Media Coverage

## Overview

**Creative North Star: "The Night Newsroom"**

The client aggregates two things that normally live apart: what agencies filed, and what the press reported. The system is built as the room where both land after dark — a desk lit low, copy set for reading rather than for scanning, and a single ember of colour marking the thing that is still burning. It is a newsroom, not a dashboard: the work is editorial judgment about a record, not telemetry.

Density is generous and vertical. Sections breathe at up to 168px of padding and text is capped between 40 and 70 characters, because the brief's first requirement is that information reach every audience. Nothing competes for attention through decoration, because there is none: the entire system carries hierarchy through type, rule, and tonal ground. The surface is flat by construction — no shadow, no radius, no transition exists anywhere in the implementation.

The restraint is doing argumentative work. The subject is a crisis, and the design refuses to dramatise it, on the theory that an unembellished record is more persuasive than an urgent one. Where the brief asks for active language for engagement, that energy belongs in verbs and in what the page asks the reader to do — never in visual volume.

**Key Characteristics:**
- Absolute flatness: zero `border-radius`, zero `box-shadow`, zero `transition` in the entire implementation
- Depth from three tonal grounds plus 1px hairlines, never from elevation
- One accent, used sparingly, always at a point of attention
- Display serif against a single grotesque; no third family
- Container-query sizing so the layout adapts continuously rather than by breakpoint

## Colors

A near-black field carrying warm off-white text, interrupted by exactly one warm accent.

### Primary
- **Ember** (`#E8613C`): the only warm accent. Current nav item, the opening quotation mark, the largest state figure, focus rings, link text, and the highest choropleth band. It marks the thing still burning.
- **Bright Ember** (`#F4835F`): hover state for every ember-coloured interactive element. Never used at rest.
- **Deep Ember** (`#C0301A`): the extreme end of the choropleth scale and its legend chip. Data only; never an interface colour.

### Neutral
- **Ink** (`#0D0E0F`): the page ground and the header's translucent backing.
- **Surface Raised** (`#121315`): the map section's ground, one step up from Ink to separate it without a border.
- **Surface Card** (`#1B1E21`): the highest tonal step, for chips and inset blocks.
- **Rule** (`#2A2D30`): the default hairline. Every section boundary and record divider.
- **Rule Strong** (`#4A4E52`): hairline where a border must read as an edge — button outlines, the attribution dash.
- **Paper** (`#F2EFEA`): primary text and inverted button grounds. Warm, never pure white.
- **Paper Dim** (`#BDB7AF`): secondary body text inside dense passages.
- **Muted** (`#9E9891`): labels, captions, coordinates, metadata, placeholders.

### Named Rules

**The One Ember Rule.** The accent family appears on no more than a few elements per viewport. Its scarcity is what makes it legible as a signal; an interface where several things are ember is an interface where nothing is.

**The Warm Neutral Rule.** No pure white and no pure black in the interface. Text is `#F2EFEA`, ground is `#0D0E0F`. `#FFFFFF` appears only inside data visualisation, where maximum contrast against a filled state is functional.

## Typography

**Display Font:** Playfair Display (with Georgia, serif)
**Body Font:** Archivo (with system-ui, sans-serif)

**Character:** A high-contrast transitional serif set very large against a neutral grotesque held very small. The pairing is a masthead against a caption — the serif carries the editorial claim, the grotesque carries the record. There is no third voice.

### Hierarchy
- **Display** (400, `clamp(58px, 15cqw, 232px)`, 0.82): the wordmark in the hero. Once per page.
- **Headline** (400, `clamp(34px, 5cqw, 78px)`, 1.06): section openers.
- **Title** (400, `clamp(28px, 3.4cqw, 50px)`, 1.12): state names, press headlines, subsection titles.
- **Body** (400, `clamp(15px, 1.15cqw, 17px)`, 1.7): running copy, capped 40–70ch.
- **Label** (500/600, `clamp(11px, 0.8cqw, 12px)`, 1, `0.2em`–`0.34em`, uppercase): kickers, eyebrows, metadata, coordinates, buttons, nav.

### Named Rules

**The Tracking Ladder Rule.** Letter-spacing and case move together. Uppercase labels are tracked from `0.2em` to `0.34em`; lowercase running text is tracked at `normal`. Wide tracking on lowercase body copy is a defect, not a style.

**The Measure Rule.** Every text block declares a `ch` cap — 40ch for display-adjacent copy, 52–58ch for body, 70ch for fine print. No paragraph runs the full 1480px container.

## Layout

A single centred column, `max-width: 1480px`, with side padding of `clamp(20px, 4cqw, 72px)`. Vertical rhythm is section padding of `clamp(72px, 9cqw, 168px)`, halved where a section abuts a rule.

The system is **container-query driven**, not breakpoint driven: the root declares `container-type: inline-size` and every size is a `clamp()` against `cqw`. This satisfies the brief's requirement that the site work across resolutions without large code changes at each breakpoint — sizes interpolate continuously instead of snapping.

Structural switches that cannot be expressed as a clamp — the header's full nav versus its compact drawer — are gated on a `compact` flag rather than CSS.

### Named Rules

**The Continuous Scale Rule.** New surfaces size with `clamp(min, Ncqw, max)` against the inline container. Reach for a media query only for a structural change no clamp can express, and say why.

## Elevation & Depth

**This system has no shadows.** There is no `box-shadow` anywhere in the implementation, and no radius. Depth is built from exactly two devices: three tonal grounds (`#0D0E0F` → `#121315` → `#1B1E21`), and 1px hairlines in `#2A2D30` or `#4A4E52`.

The one atmospheric device is photographic: night imagery overlaid with `linear-gradient` scrims in `rgba(13,14,15,…)` to hold text contrast, plus a single low-alpha ember `radial-gradient` used as a glow behind the hero. That glow is scene lighting, not elevation.

The header is the only floating element, held by `position: sticky` with `rgba(13,14,15,0.9)` and `backdrop-filter: blur(12px)` — separated by a hairline, never a shadow.

### Named Rules

**The No-Shadow Rule.** Surfaces never lift. To separate two planes, change the tonal ground or draw a hairline. A `box-shadow` anywhere in this system is a defect.

**The Still Surface Rule.** The implementation declares no `transition` and no animation. State changes are instant colour swaps. Motion must be argued for, not assumed.

## Shapes

Every corner is square. `border-radius` is `0` throughout, with no exceptions — buttons, chips, cards, inputs, images, and the map all terminate in hard corners.

Borders are always exactly `1px`, solid, in `Rule` or `Rule Strong`. The system draws lines rather than filling boxes: dividers, section boundaries, table-like record rows, and the 28px attribution dash are all the same hairline vocabulary at different lengths. The resulting silhouette is rectilinear and typographic, closer to a printed ledger than to a card-based interface.

## Components

### Buttons
- **Shape:** square (`border-radius: 0`), `1px` border
- **Primary (CTA):** transparent ground, `Paper` text, `1px solid Rule Strong`, `min-height: 46px`, padding `0 clamp(16px, 1.6cqw, 26px)`, uppercase label at `600`, `11px`, `0.2em`
- **Inverted:** `Paper` ground with `Ink` text, used for the skip link and the highest-emphasis action
- **Hover / Focus:** colour swap only — text to `Ember Bright`. Focus is the global `3px solid Ember` ring at `3px` offset. No lift, no shadow, no transition

### Navigation
- **Style:** uppercase label, `500`, `clamp(11px, 0.8cqw, 12px)`, `0.2em`, `min-height: 44px`
- **Default `Paper` · Hover `Ember Bright` · Current `Ember`** with `aria-current`
- **Header:** sticky, `rgba(13,14,15,0.9)` with `blur(12px)`, `1px solid Rule` bottom, `min-height: 78px`
- **Compact:** a 46px square hamburger opens a full-width drawer of 58px rows divided by `Rule` hairlines

### Cards / Containers
- **Corner Style:** square, always
- **Background:** the section ground; record cards are not filled
- **Shadow Strategy:** none — see Elevation & Depth
- **Border:** a single `1px solid Rule` on top, dividing rows like a ledger
- **Internal Padding:** `clamp(20px, 2.4cqw, 34px)` vertical

### State Record (signature component)
The system's defining pattern. A hairline-topped row carrying: an uppercase reporting window on the right, the state name in Title serif, the count set in Title-scale ember, an uppercase `RECORDED STARTS` label, a short attribution paragraph in `Paper Dim`, and an `OPEN THE FILING` label-link with decimal coordinates beneath it in `Muted`. Every figure travels with its provenance; splitting the two breaks the product's core promise.

### Choropleth Map (signature component)
A D3 + topojson US map on `Surface Raised`. Unreported states hold the ground colour with a `Rule` stroke; reported states fill along a four-band ember ramp toward `Ember Deep`, labelled in `#FFFFFF` directly on the shape. A square-chip legend names every band, including `NO DATA`. Land class is switched by a row of square uppercase chips.

## Do's and Don'ts

### Do:
- **Do** size with `clamp(min, Ncqw, max)` against the inline container so layouts adapt continuously.
- **Do** separate planes with a tonal ground change or a `1px` hairline.
- **Do** pair wide tracking with uppercase, and only with uppercase.
- **Do** cap every text block with a `ch` measure.
- **Do** keep a figure and its route back to the source in the same component.
- **Do** state absence explicitly — `NO DATA`, `Not yet reported`, `3 of 50 filed` — rather than omitting the row.
- **Do** hold the accessibility floor already shipped: skip link, `3px solid Ember` focus ring at `3px` offset, 44px minimum targets.

### Don't:
- **Don't** add `border-radius`. The system is square everywhere.
- **Don't** add `box-shadow`. Depth comes from tone and hairline.
- **Don't** add `transition` or animation without an explicit decision; the implementation is motionless by construction.
- **Don't** introduce a third type family, or set Playfair below Title scale.
- **Don't** spend the ember on more than a few elements per viewport.
- **Don't** use pure white or pure black in the interface; `#FFFFFF` is reserved for data labels.
- **Don't** fill a gap in the record to balance a composition.
