# Quickie

Quickie is a small personal typography playground for turning text into highly art-directed still images.

The important architectural rule is simple:

ENGINE = stable  
DESIGN = disposable

The editor should not be regenerated every time the visual direction changes.

## What V1 does

- multiple independent text elements
- direct text editing
- selection
- drag
- resize
- rotate
- keyboard nudging
- duplicate / delete
- layer forward / backward
- font family, size, weight, line height and tracking
- alignment, colour and opacity
- basic shapes
- canvas sizes and common aspect-ratio presets
- local save / load
- 1×–4× PNG export
- Chinese, English and mixed-language compositions
- intentional overlap, rotation, clipping and off-canvas placement

## Files

~~~text
index.html
engine.css
engine.js
design.js
theme.css
~~~

### engine.js / engine.css

Reusable editor behaviour.

These files own:

- canvas rendering
- selection
- drag / resize / rotate
- content editing
- inspector controls
- layer operations
- persistence
- font loading
- PNG export

A new visual direction should normally NOT modify these files.

### design.js

The design specification.

This is the file AI should primarily generate when you describe a new visual world.

It contains:

- canvas dimensions and background
- webfont sources
- elements
- initial positions
- typography
- hierarchy
- z-index
- basic shape styling

Elements intentionally accept normal CSS style properties. They are not restricted to a rigid poster template.

### theme.css

The visual escape hatch.

Use this for art direction that cannot or should not be expressed as ordinary element data:

- pseudo-elements
- blend modes
- clipping
- filters
- unusual writing modes
- page-wide texture
- custom class behaviour
- deliberate visual damage

Do not add one-off visual logic to engine.js when theme.css can express it.

## Interaction

- click: select
- drag: move
- drag an element edge: resize
- circular handle above the selection: rotate
- double click text: edit
- Escape or blur: leave text editing
- arrow keys: nudge 1 px
- Shift + arrow keys: nudge 10 px
- Cmd/Ctrl + D: duplicate
- Delete/Backspace: delete

## Running

Quickie is a static site.

Serve the folder over HTTP rather than relying on file:// URLs because remote fonts and image export behave more consistently that way.

For example:

~~~sh
python3 -m http.server 8080
~~~

Then open:

~~~text
http://localhost:8080
~~~

It can also be hosted directly as a static site, including GitHub Pages.

## Creating a new visual direction

Keep engine.js and engine.css unchanged.

Replace the composition in design.js and add visual exceptions in theme.css.

A useful future AI instruction is:

> Do not rebuild the editor. Design for the existing Quickie engine. Translate the art direction into design.js plus optional theme.css. Only modify the engine when the visual idea cannot reasonably be expressed by the existing element schema and CSS escape hatch.

The desired workflow is:

~~~text
vague feeling
→ visual research
→ art direction
→ design.js + theme.css
→ Quickie
→ manual adjustment
→ PNG
~~~

## Design element contract

A text element can look like:

~~~js
{
  id: "main",
  type: "text",
  content: "一段文字",
  x: 100,
  y: 200,
  width: 600,
  height: 300,
  rotation: -2,
  z: 4,
  className: "optional-theme-class",
  style: {
    fontFamily: "\"Noto Serif SC\", serif",
    fontSize: "72px",
    fontWeight: "600",
    lineHeight: "1.4",
    letterSpacing: "0.04em",
    textAlign: "left",
    color: "#111111",
    opacity: "1"
  },
  css: {
    mixBlendMode: "multiply"
  }
}
~~~

A shape uses the same transform fields and style object:

~~~js
{
  id: "rule",
  type: "shape",
  shape: "rect",
  x: 100,
  y: 1000,
  width: 300,
  height: 6,
  rotation: 0,
  z: 2,
  style: {
    background: "#9B2026",
    opacity: "1",
    borderRadius: "0px"
  }
}
~~~

Negative x/y values are valid. Large elements extending beyond the artboard are valid. Overlap is valid. Strange rotation is valid. The artboard crops overflow intentionally.

## Dependencies

The browser imports dependencies directly from jsDelivr:

- interact.js 1.10.28
- html-to-image 1.11.11

html-to-image is intentionally pinned to 1.11.11 for V1 because later 1.11.13 reports include font/style export regressions. Export code still catches font-embedding preflight failures and falls back to the library's normal font handling.

## Known V1 limits

- Export is designed around modern Chromium first. Browser differences around SVG foreignObject and webfont embedding still exist.
- Resize interaction on heavily rotated objects is basic rather than Illustrator-grade.
- Save/load currently uses localStorage rather than portable project files.
- Shapes are intentionally minimal.
- There is no backend, account system, template marketplace or video timeline.

Those constraints are deliberate. Quickie should remain a typography toy, not become a design SaaS.
