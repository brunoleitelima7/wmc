# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Seven confirmed segments, supplied by the user as a segment-to-job map. `Monitor fire conditions` is the shared hub job nearly every segment reaches; the rest fan out by segment.

| Segment | Jobs |
|---|---|
| Concerned citizens | Monitor fire conditions · Respond to emergencies · Advocate policy change |
| Environmental organizations | Monitor fire risk zones · Advocate policy change · Analyze data · Monitor fire conditions |
| Government agencies | Plan forest restoration · Respond to emergencies · Analyze data · Monitor fire conditions |
| Researchers and students | Develop models · Track trends · Analyze impact · Analyze data · Monitor fire conditions |
| Journalists and media professionals | Inform decision-making · Advocate policy change · Respond to emergencies · Monitor fire conditions |
| Health and community workers | Analyze impact · Identify improvements · Monitor fire conditions |
| Activists and policy makers | Advocate policy change · Inform decision-making · Identify improvements · Analyze impact · Monitor fire conditions |

Segment labels and job labels are verbatim from the user's map. Individual edges are read from that diagram; the segment sets and the hub job are the load-bearing facts, not the exact per-edge count.

No primary segment has been designated. The incumbent homepage is written for a reader who already trusts primary records — closest to journalists, researchers, and agencies — but that is the page's implied audience, not a confirmed product decision.

## Product Purpose

**Wildfire Media Coverage** analyses and presents data on US wildfires. Per the client brief, it aggregates media coverage, climate data, and environmental impacts, and lets visitors search specific regions (California is the named example), follow the history of fires, and see consequences for communities and ecosystems. Its data is drawn from public records of government agencies and from reporting by media outlets.

Wildfires are framed in the brief as a growing crisis driven by climate change, drought, and decades of fire suppression. The site exists to make that record legible.

## Positioning

The mechanism is provenance: every figure is traceable to the public filing or the report it came from, and the site says which. It aggregates two sources that usually live apart — agency records and press coverage — and holds them to the same standard of attribution. The shipped homepage extends this into a refusal to model, estimate, or interpolate: where a state filed nothing, it stays blank.

## Operating Context

Read on the web, desktop and mobile. The visitor arrives from a story, a search, or a citation, usually to settle one question about one state, then either leaves with the number or opens the underlying filing. The Corrections section is part of the product, not a footer: being wrong in public and fixing it in public is the operating ritual.

## Capabilities and Constraints

- Sections shipped: Hero, Opening, The season, State records, Quote, Map, Press, Agencies, Corrections.
- Built as a Claude Design canvas artboard (`Wildfire Homepage v3 Night.dc.html`) interpreted by `support.js`, using `<sc-if>`, `<sc-for>`, and `<x-import>` rather than a conventional framework. Edits happen in that file's inline styles.
- Responsive behavior is container-query driven (`container-type:inline-size`, `clamp(...cqw...)`), not viewport media queries.
- The US choropleth is a D3 + topojson import (`us-choropleth.js`) that recolours by land class.
- Authored props: `compact` (layout), `activeSection` (navbar), `defaultMetric` (map).
- External runtime dependencies: d3 7.9.0 and topojson-client 3.1.0 from unpkg, Google Fonts.

**Brief requirements (Atomsix Studio, Product Designer technical test).**

- *Accessibility focus.* Make information reachable by every audience; follow UX, information-design, and accessibility good practice. The brief states deliverables gain value when accompanied by **verification and proof** — contrast tests, accessibility tests.
- *Responsiveness.* Must work well across many resolutions, **preferably without large code changes at each breakpoint**. The incumbent container-query approach satisfies this; the header does not (see below).
- *Detailed, instructive handoff.* The client develops the site themselves and needs explicit instruction on applying the design. Deliverables include a **styleguide** so the client can replicate design patterns on new pages.
- *Stated design decisions:* **Bootstrap v5.2**, and **active language for engagement with the cause**.
- *Diagnosed problems with the current site:* visualisation of complex fire and environmental-impact data; organisation of information hierarchy, interactive maps, and an event timeline.

**Open conflict — voice.** The brief's design decision is *active language for engagement with the cause*. The shipped homepage voice is deliberately flat, declarative, and unpersuaded, and the user confirmed the night world as binding. Engagement-driven copy and documentary restraint pull in opposite directions. Unresolved; do not quietly rewrite the copy in either direction.

**Open conflict — Bootstrap.** The brief names Bootstrap v5.2 as a design decision. The artboard uses no Bootstrap: it is a Claude Design canvas with inline styles and container queries. Whether the delivered handoff must map to Bootstrap's grid and components is unresolved.

**Open conflict — scope.** The confirmed job map is dominated by present-tense and predictive jobs: `Monitor fire conditions` (the hub), `Respond to emergencies`, `Monitor fire risk zones`, `Develop models`. The brief's product covers history, climate data, and media coverage, but not live incident monitoring or prediction. The shipped homepage narrows further to a closed 2023 record. Which of the three scopes governs is undecided.

**Defect — responsive header.** The header's wide/compact switch is driven by the authored `compact` prop with no width detection anywhere in the page (`wide: !compact`). At 375px the right-hand group extends to x=532, so `Records` is clipped and the `Corrections` CTA is entirely off-screen; `overflow-x:hidden` on the root means there is no scroll to reach it. This violates the brief's responsiveness requirement. Unfixed pending a decision between auto-detection and a separate compact artboard.

## Brand Commitments

The night visual world is binding, confirmed by the user:

- Ground `#0D0E0F`, text `#F2EFEA`, ember accent `#E8613C` (hover `#F4835F`), rules `#2A2D30`.
- Playfair Display for display type, Archivo for everything else.
- Editorial voice: flat, declarative, unpersuaded. "A containment figure is not a measure of safety. It is a measure of the line we have managed to hold." No marketing register.
- Name: Wildfire, subtitled "United States". The client name in the brief is **Wildfire Media Coverage**.

## Evidence on Hand

**This is a design deliverable for a technical test**, not a running product. The user confirmed it as a design/portfolio piece.

The brief establishes that the real product's data comes from public records of government agencies and from media reporting. But the specific figures rendered in this artboard (56,580 recorded starts; Oregon 7,876; California 8,412; Texas 9,134), the named agencies, the filing links, the press quotes, and the coordinates are **illustrative placeholders**, not verified values.

Future work must not present these specific numbers as sourced, add real-looking provenance to them, or invent further statistics, agencies, testimonials, or press. No filing archive, ingestion pipeline, or API exists behind the artboard.

**Source documents.** The brief and supporting research live in the Figma file `oUPhDG2NoKnOqZ5XHbW1gx` ("Teste Técnico - Product Designer", Atomsix Studio LLC), in four sections: `Start Here!` (the briefing, node 43:3624), `User Flow/Sitemap` (including the segment-to-job map used in Users above), `Competitors/Benchmarking`, and `Wireframes`.

## Product Principles

1. **Absence is content.** A blank state is information. Never fill a gap to make the composition even.
2. **Every number keeps its receipt.** A figure and its route back to the source travel together; separating them is what the product exists not to do.
3. **The record is the voice.** Flat, declarative, and unpersuaded — the restraint is the argument, not a style preference.
4. **Correcting is a feature.** Being wrong in public and visibly fixing it is part of the surface, never tucked away.
5. **Craft carries the weight.** As a portfolio piece, execution quality is the actual deliverable; the data is the vehicle.

## Accessibility & Inclusion

Binding, confirmed by the user. Already shipped and must survive any redesign: skip link to content, visible focus rings (`3px solid #E8613C`, `3px` offset), 44px minimum interactive targets, and light-on-dark contrast held across the night palette. Any new surface inherits the same floor.
