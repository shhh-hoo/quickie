import interact from "https://cdn.jsdelivr.net/npm/interactjs@1.10.28/+esm";
import * as htmlToImage from "https://cdn.jsdelivr.net/npm/html-to-image@1.11.11/+esm";

const STORAGE_KEY = "quickie-design-v1";
const sourceDesign = structuredClone(window.DESIGN);

let state = structuredClone(sourceDesign);
let selectedId = null;
let viewScale = 1;
let statusTimer = null;

const artboard = document.getElementById("artboard");
const artboardWrap = document.getElementById("artboardWrap");
const stage = document.querySelector(".stage");
const inspector = document.getElementById("inspector");
const status = document.getElementById("status");

function clone(value) {
  return structuredClone(value);
}

function uid(prefix) {
  return (
    prefix +
    "-" +
    Date.now() +
    "-" +
    Math.random().toString(36).slice(2, 7)
  );
}

function number(value, fallback) {
  const parsed = parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function currentElement() {
  return state.elements.find(function (item) {
    return item.id === selectedId;
  }) || null;
}

function currentNode() {
  if (!selectedId) return null;
  return artboard.querySelector('[data-id="' + CSS.escape(selectedId) + '"]');
}

function topZ() {
  return Math.max(
    0,
    ...state.elements.map(function (item) {
      return item.z || 0;
    })
  );
}

function bottomZ() {
  return Math.min(
    0,
    ...state.elements.map(function (item) {
      return item.z || 0;
    })
  );
}

function setStatus(message, timeout) {
  clearTimeout(statusTimer);
  status.textContent = message || "";

  if (message) {
    statusTimer = setTimeout(function () {
      status.textContent = "";
    }, timeout || 1800);
  }
}

function injectFonts() {
  document
    .querySelectorAll("[data-quickie-font]")
    .forEach(function (node) {
      node.remove();
    });

  (state.fonts || []).forEach(function (font) {
    if (!font.cssUrl) return;

    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = font.cssUrl;
    link.dataset.quickieFont = "true";
    document.head.appendChild(link);
  });
}

function configureCanvas() {
  artboard.style.width = state.canvas.width + "px";
  artboard.style.height = state.canvas.height + "px";
  artboard.style.background = state.canvas.background;
  fitCanvas();
}

function fitCanvas() {
  const rect = stage.getBoundingClientRect();
  const maxWidth = Math.max(100, rect.width - 70);
  const maxHeight = Math.max(100, rect.height - 70);

  viewScale = Math.min(
    maxWidth / state.canvas.width,
    maxHeight / state.canvas.height,
    1
  );

  artboardWrap.style.width = state.canvas.width * viewScale + "px";
  artboardWrap.style.height = state.canvas.height * viewScale + "px";
  artboard.style.transform = "scale(" + viewScale + ")";
}

function applyTransform(node, item) {
  if (!node) return;

  node.style.left = "0";
  node.style.top = "0";
  node.style.width = item.width + "px";
  node.style.height = item.height + "px";
  node.style.zIndex = String(item.z || 0);
  node.style.transform =
    "translate(" +
    item.x +
    "px, " +
    item.y +
    "px) rotate(" +
    (item.rotation || 0) +
    "deg)";
}

function applyBodyStyle(body, item) {
  if (!body) return;

  body.removeAttribute("style");
  Object.assign(body.style, item.style || {});
  Object.assign(body.style, item.css || {});

  if (item.type === "shape") {
    body.style.width = "100%";
    body.style.height = "100%";
  }
}

function makeElement(item) {
  const root = document.createElement("div");
  root.className = "art-element art-element--" + item.type;
  root.dataset.id = item.id;

  if (item.className) {
    item.className
      .split(/\s+/)
      .filter(Boolean)
      .forEach(function (name) {
        root.classList.add(name);
      });
  }

  const body = document.createElement("div");
  body.className = "element-body";

  if (item.type === "text") {
    body.textContent = item.content || "";
  }

  if (item.type === "shape") {
    root.classList.add("shape--" + (item.shape || "rect"));
  }

  const rotateHandle = document.createElement("div");
  rotateHandle.className = "rotate-handle";
  rotateHandle.setAttribute("aria-hidden", "true");

  root.append(body, rotateHandle);

  applyTransform(root, item);
  applyBodyStyle(body, item);

  root.addEventListener("pointerdown", function (event) {
    if (
      event.target.closest(".rotate-handle") ||
      root.classList.contains("is-editing")
    ) {
      return;
    }

    selectElement(item.id);
  });

  if (item.type === "text") {
    root.addEventListener("dblclick", function (event) {
      event.stopPropagation();
      selectElement(item.id);
      enterTextEditing(root, item);
    });

    body.addEventListener("input", function () {
      item.content = body.innerText;
      syncContentField();
    });

    body.addEventListener("keydown", function (event) {
      if (event.key === "Escape") {
        event.preventDefault();
        body.blur();
      }
    });

    body.addEventListener("blur", function () {
      exitTextEditing(root, body);
    });
  }

  rotateHandle.addEventListener("pointerdown", function (event) {
    beginRotation(event, root, item);
  });

  attachInteraction(root, item);

  return root;
}

function renderElements() {
  artboard.replaceChildren();

  state.elements.forEach(function (item) {
    artboard.appendChild(makeElement(item));
  });

  refreshSelection();
}

function renderAll() {
  injectFonts();
  configureCanvas();
  renderElements();
  renderInspector();
}

function attachInteraction(node, item) {
  interact(node)
    .draggable({
      ignoreFrom: '[contenteditable="true"], .rotate-handle',
      listeners: {
        move: function (event) {
          if (node.classList.contains("is-editing")) return;

          item.x += event.dx / viewScale;
          item.y += event.dy / viewScale;

          applyTransform(node, item);
          refreshInspectorTransform();
        }
      }
    })
    .resizable({
      edges: {
        left: true,
        right: true,
        top: true,
        bottom: true
      },
      ignoreFrom: '[contenteditable="true"], .rotate-handle',
      listeners: {
        move: function (event) {
          if (node.classList.contains("is-editing")) return;

          item.width = Math.max(10, event.rect.width / viewScale);
          item.height = Math.max(10, event.rect.height / viewScale);
          item.x += event.deltaRect.left / viewScale;
          item.y += event.deltaRect.top / viewScale;

          applyTransform(node, item);
          refreshInspectorTransform();
        }
      }
    });
}

function selectElement(id) {
  selectedId = id;
  refreshSelection();
  renderInspector();
}

function clearSelection() {
  selectedId = null;
  refreshSelection();
  renderInspector();
}

function refreshSelection() {
  artboard.querySelectorAll(".art-element").forEach(function (node) {
    node.classList.toggle("is-selected", node.dataset.id === selectedId);
  });
}

function enterTextEditing(root) {
  const body = root.querySelector(".element-body");

  root.classList.add("is-editing");
  body.contentEditable = "true";
  body.focus();

  const range = document.createRange();
  range.selectNodeContents(body);
  range.collapse(false);

  const selection = window.getSelection();
  selection.removeAllRanges();
  selection.addRange(range);
}

function exitTextEditing(root, body) {
  body.contentEditable = "false";
  root.classList.remove("is-editing");
}

function finishAnyEditing() {
  artboard.querySelectorAll(".is-editing").forEach(function (root) {
    const body = root.querySelector(".element-body");

    if (body) {
      body.contentEditable = "false";
      body.blur();
    }

    root.classList.remove("is-editing");
  });
}

function beginRotation(event, node, item) {
  event.preventDefault();
  event.stopPropagation();

  selectElement(item.id);

  const rect = node.getBoundingClientRect();
  const centerX = rect.left + rect.width / 2;
  const centerY = rect.top + rect.height / 2;

  const startAngle = Math.atan2(
    event.clientY - centerY,
    event.clientX - centerX
  );

  const startRotation = item.rotation || 0;

  function move(moveEvent) {
    const angle = Math.atan2(
      moveEvent.clientY - centerY,
      moveEvent.clientX - centerX
    );

    const delta = (angle - startAngle) * (180 / Math.PI);
    item.rotation = Math.round((startRotation + delta) * 10) / 10;

    applyTransform(node, item);
    refreshInspectorTransform();
  }

  function stop() {
    window.removeEventListener("pointermove", move);
    window.removeEventListener("pointerup", stop);
  }

  window.addEventListener("pointermove", move);
  window.addEventListener("pointerup", stop);
}

function make(tag, className, text) {
  const node = document.createElement(tag);

  if (className) node.className = className;
  if (text !== undefined && text !== null) node.textContent = text;

  return node;
}

function section(title) {
  const root = make("section", "inspector-section");
  root.appendChild(make("h2", "inspector-title", title));
  inspector.appendChild(root);
  return root;
}

function field(labelText, control) {
  const root = make("label", "field");
  root.appendChild(make("span", "field-label", labelText));
  root.appendChild(control);
  return root;
}

function row() {
  return make("div", "field-row");
}

function input(type, value, onInput, attributes) {
  const control = document.createElement("input");
  control.type = type;
  control.value = value === undefined || value === null ? "" : String(value);

  Object.entries(attributes || {}).forEach(function (entry) {
    control.setAttribute(entry[0], String(entry[1]));
  });

  control.addEventListener("input", function () {
    onInput(control.value, control);
  });

  return control;
}

function select(options, value, onChange) {
  const control = document.createElement("select");

  options.forEach(function (optionData) {
    const option = document.createElement("option");
    option.value = optionData.value;
    option.textContent = optionData.label;
    option.selected = optionData.value === value;
    control.appendChild(option);
  });

  control.addEventListener("change", function () {
    onChange(control.value, control);
  });

  return control;
}

function button(label, onClick, className) {
  const control = make("button", className || "", label);
  control.type = "button";
  control.addEventListener("click", onClick);
  return control;
}

function renderCanvasInspector() {
  const root = section("Canvas");
  const sizeRow = row();

  sizeRow.append(
    field(
      "Width",
      input(
        "number",
        state.canvas.width,
        function (value) {
          state.canvas.width = Math.max(100, number(value, 1080));
          configureCanvas();
        },
        { min: 100, step: 1 }
      )
    ),
    field(
      "Height",
      input(
        "number",
        state.canvas.height,
        function (value) {
          state.canvas.height = Math.max(100, number(value, 1440));
          configureCanvas();
        },
        { min: 100, step: 1 }
      )
    )
  );

  const bg = input("color", state.canvas.background, function (value) {
    state.canvas.background = value;
    artboard.style.background = value;
  });

  const presetOptions = [
    { label: "Custom", value: "" },
    { label: "1:1 · 1080×1080", value: "1080x1080" },
    { label: "4:5 · 1080×1350", value: "1080x1350" },
    { label: "3:4 · 1080×1440", value: "1080x1440" },
    { label: "9:16 · 1080×1920", value: "1080x1920" }
  ];

  const preset = select(presetOptions, "", function (value) {
    if (!value) return;

    const parts = value.split("x");
    state.canvas.width = Number(parts[0]);
    state.canvas.height = Number(parts[1]);

    configureCanvas();
    renderInspector();
  });

  root.append(sizeRow, field("Background", bg), field("Preset", preset));
}

function renderTextInspector(item, node) {
  const body = node.querySelector(".element-body");
  const root = section("Text");

  const textarea = document.createElement("textarea");
  textarea.value = item.content || "";
  textarea.addEventListener("input", function () {
    item.content = textarea.value;
    body.textContent = item.content;
  });

  root.appendChild(field("Content", textarea));

  const fontOptions = (state.fonts || []).map(function (font) {
    return { label: font.label, value: font.family };
  });

  if (
    item.style.fontFamily &&
    !fontOptions.some(function (font) {
      return font.value === item.style.fontFamily;
    })
  ) {
    fontOptions.push({
      label: item.style.fontFamily,
      value: item.style.fontFamily
    });
  }

  fontOptions.push(
    { label: "System Sans", value: "sans-serif" },
    { label: "System Serif", value: "serif" }
  );

  root.appendChild(
    field(
      "Font",
      select(fontOptions, item.style.fontFamily, function (value) {
        item.style.fontFamily = value;
        applyBodyStyle(body, item);
      })
    )
  );

  const typeRow = row();
  typeRow.append(
    field(
      "Size",
      input(
        "number",
        number(item.style.fontSize, 48),
        function (value) {
          item.style.fontSize = number(value, 48) + "px";
          applyBodyStyle(body, item);
        },
        { min: 1, step: 1 }
      )
    ),
    field(
      "Weight",
      input(
        "number",
        number(item.style.fontWeight, 400),
        function (value) {
          item.style.fontWeight = String(number(value, 400));
          applyBodyStyle(body, item);
        },
        { min: 100, max: 900, step: 100 }
      )
    )
  );

  const spacingRow = row();
  spacingRow.append(
    field(
      "Line height",
      input(
        "number",
        number(item.style.lineHeight, 1.4),
        function (value) {
          item.style.lineHeight = String(number(value, 1.4));
          applyBodyStyle(body, item);
        },
        { min: 0.5, step: 0.05 }
      )
    ),
    field(
      "Tracking (em)",
      input(
        "number",
        number(item.style.letterSpacing, 0),
        function (value) {
          item.style.letterSpacing = number(value, 0) + "em";
          applyBodyStyle(body, item);
        },
        { step: 0.01 }
      )
    )
  );

  const align = select(
    [
      { label: "Left", value: "left" },
      { label: "Center", value: "center" },
      { label: "Right", value: "right" },
      { label: "Justify", value: "justify" }
    ],
    item.style.textAlign || "left",
    function (value) {
      item.style.textAlign = value;
      applyBodyStyle(body, item);
    }
  );

  const color = input("color", item.style.color || "#000000", function (value) {
    item.style.color = value;
    applyBodyStyle(body, item);
  });

  root.append(typeRow, spacingRow, field("Align", align), field("Colour", color));
}

function renderShapeInspector(item, node) {
  const body = node.querySelector(".element-body");
  const root = section("Shape");

  const fill = input(
    "color",
    item.style.background || "#000000",
    function (value) {
      item.style.background = value;
      applyBodyStyle(body, item);
    }
  );

  const radius = input(
    "number",
    number(item.style.borderRadius, 0),
    function (value) {
      item.style.borderRadius = number(value, 0) + "px";
      applyBodyStyle(body, item);
    },
    { min: 0, step: 1 }
  );

  root.append(field("Fill", fill), field("Corner radius", radius));
}

function renderTransformInspector(item, node) {
  const body = node.querySelector(".element-body");
  const root = section("Transform");

  function transformField(label, key, options) {
    const control = input(
      "number",
      Math.round(number(item[key], 0) * 10) / 10,
      function (value) {
        item[key] = number(value, options.fallback || 0);

        if (key === "width" || key === "height") {
          item[key] = Math.max(1, item[key]);
        }

        applyTransform(node, item);
      },
      {
        min: options.min === undefined ? "" : options.min,
        step: options.step || 1
      }
    );

    control.dataset.transformKey = key;

    if (options.min === undefined) {
      control.removeAttribute("min");
    }

    return field(label, control);
  }

  const positionRow = row();
  positionRow.append(
    transformField("X", "x", { step: 1 }),
    transformField("Y", "y", { step: 1 })
  );

  const sizeRow = row();
  sizeRow.append(
    transformField("Width", "width", { min: 1, step: 1 }),
    transformField("Height", "height", { min: 1, step: 1 })
  );

  const finalRow = row();
  finalRow.append(
    transformField("Rotation", "rotation", { step: 0.1 }),
    field(
      "Opacity",
      input(
        "number",
        number(item.style.opacity, 1),
        function (value) {
          item.style.opacity = String(
            Math.max(0, Math.min(1, number(value, 1)))
          );
          applyBodyStyle(body, item);
        },
        { min: 0, max: 1, step: 0.05 }
      )
    )
  );

  root.append(positionRow, sizeRow, finalRow);
}

function renderLayerInspector(item, node) {
  const root = section("Layer");
  const actions = make("div", "actions");

  actions.append(
    button("Forward", function () {
      item.z = topZ() + 1;
      applyTransform(node, item);
    }),
    button("Backward", function () {
      item.z = bottomZ() - 1;
      applyTransform(node, item);
    }),
    button("Duplicate", duplicateSelected),
    button("Delete", deleteSelected, "danger")
  );

  root.appendChild(actions);
}

function renderInspector() {
  inspector.replaceChildren();
  renderCanvasInspector();

  const item = currentElement();

  if (!item) {
    const root = section("Selection");
    root.appendChild(
      make(
        "div",
        "hint",
        "Click to select. Drag to move. Drag edges to resize. Double-click text to edit. Use the circular handle to rotate."
      )
    );
    return;
  }

  const node = currentNode();

  if (!node) return;

  if (item.type === "text") {
    renderTextInspector(item, node);
  } else if (item.type === "shape") {
    renderShapeInspector(item, node);
  }

  renderTransformInspector(item, node);
  renderLayerInspector(item, node);
}

function refreshInspectorTransform() {
  const item = currentElement();
  if (!item) return;

  inspector.querySelectorAll("[data-transform-key]").forEach(function (control) {
    if (document.activeElement === control) return;

    const key = control.dataset.transformKey;
    control.value = Math.round(number(item[key], 0) * 10) / 10;
  });
}

function syncContentField() {
  const item = currentElement();

  if (!item || item.type !== "text") return;

  const textarea = inspector.querySelector("textarea");

  if (textarea && document.activeElement !== textarea) {
    textarea.value = item.content || "";
  }
}

function addText() {
  const item = {
    id: uid("text"),
    type: "text",
    content: "新的文字",
    x: state.canvas.width * 0.15,
    y: state.canvas.height * 0.15,
    width: state.canvas.width * 0.55,
    height: 150,
    rotation: 0,
    z: topZ() + 1,
    style: {
      fontFamily:
        (state.fonts && state.fonts[0] && state.fonts[0].family) || "serif",
      fontSize: "54px",
      fontWeight: "400",
      lineHeight: "1.45",
      letterSpacing: "0",
      textAlign: "left",
      color: "#111111",
      opacity: "1"
    }
  };

  state.elements.push(item);
  renderElements();
  selectElement(item.id);
}

function addShape() {
  const item = {
    id: uid("shape"),
    type: "shape",
    shape: "rect",
    x: state.canvas.width * 0.2,
    y: state.canvas.height * 0.2,
    width: 220,
    height: 80,
    rotation: 0,
    z: topZ() + 1,
    style: {
      background: "#111111",
      opacity: "1",
      borderRadius: "0px"
    }
  };

  state.elements.push(item);
  renderElements();
  selectElement(item.id);
}

function duplicateSelected() {
  const item = currentElement();
  if (!item) return;

  const copy = clone(item);
  copy.id = uid(item.type);
  copy.x += 28;
  copy.y += 28;
  copy.z = topZ() + 1;

  state.elements.push(copy);
  renderElements();
  selectElement(copy.id);
}

function deleteSelected() {
  if (!selectedId) return;

  state.elements = state.elements.filter(function (item) {
    return item.id !== selectedId;
  });

  selectedId = null;
  renderElements();
  renderInspector();
}

function saveDesign() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  setStatus("Saved");
}

function loadDesign() {
  const raw = localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    setStatus("No save");
    return;
  }

  try {
    state = JSON.parse(raw);
    selectedId = null;
    renderAll();
    setStatus("Loaded");
  } catch (error) {
    console.error(error);
    setStatus("Load failed");
  }
}

function resetDesign() {
  state = clone(sourceDesign);
  selectedId = null;
  renderAll();
  setStatus("Reset");
}

async function exportPng() {
  const scale = number(document.getElementById("exportScale").value, 2);
  const previousSelection = selectedId;
  const previousTransform = artboard.style.transform;

  finishAnyEditing();
  selectedId = null;
  refreshSelection();

  setStatus("Exporting…", 10000);

  try {
    await document.fonts.ready;

    artboard.classList.add("is-exporting");
    artboard.style.transform = "none";

    const options = {
      width: state.canvas.width,
      height: state.canvas.height,
      pixelRatio: scale,
      cacheBust: true,
      preferredFontFormat: "woff2"
    };

    try {
      options.fontEmbedCSS = await htmlToImage.getFontEmbedCSS(artboard);
    } catch (error) {
      console.warn("Quickie: font embedding preflight failed; using library fallback.", error);
    }

    const dataUrl = await htmlToImage.toPng(artboard, options);
    const link = document.createElement("a");
    const rawName = (state.meta && state.meta.name) || "quickie";

    link.download = rawName.replace(/[^\w\u4e00-\u9fff-]+/g, "-") + ".png";
    link.href = dataUrl;
    link.click();

    setStatus("Exported");
  } catch (error) {
    console.error(error);
    setStatus("Export failed", 4000);
    alert(
      "PNG export failed. Check the console. Remote webfonts are the most common cause."
    );
  } finally {
    artboard.classList.remove("is-exporting");
    artboard.style.transform = previousTransform;
    selectedId = previousSelection;
    refreshSelection();
  }
}

function isEditingText() {
  return Boolean(document.activeElement && document.activeElement.isContentEditable);
}

document.addEventListener("keydown", function (event) {
  if (isEditingText()) return;

  const item = currentElement();
  if (!item) return;

  if (event.key === "Backspace" || event.key === "Delete") {
    event.preventDefault();
    deleteSelected();
    return;
  }

  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "d") {
    event.preventDefault();
    duplicateSelected();
    return;
  }

  const amount = event.shiftKey ? 10 : 1;
  const moves = {
    ArrowLeft: [-amount, 0],
    ArrowRight: [amount, 0],
    ArrowUp: [0, -amount],
    ArrowDown: [0, amount]
  };

  if (!moves[event.key]) return;

  event.preventDefault();

  item.x += moves[event.key][0];
  item.y += moves[event.key][1];

  applyTransform(currentNode(), item);
  refreshInspectorTransform();
});

artboard.addEventListener("pointerdown", function (event) {
  if (event.target === artboard) {
    clearSelection();
  }
});

document.getElementById("addText").addEventListener("click", addText);
document.getElementById("addShape").addEventListener("click", addShape);
document.getElementById("saveDesign").addEventListener("click", saveDesign);
document.getElementById("loadDesign").addEventListener("click", loadDesign);
document.getElementById("resetDesign").addEventListener("click", resetDesign);
document.getElementById("exportPng").addEventListener("click", exportPng);

new ResizeObserver(fitCanvas).observe(stage);

renderAll();
