window.DESIGN = {
  meta: {
    name: "unsent-01",
    description: "A restrained editorial letter with a clinical edge."
  },

  canvas: {
    width: 1080,
    height: 1440,
    background: "#F1EEE7"
  },

  fonts: [
    {
      label: "Noto Serif SC",
      family: "\"Noto Serif SC\", \"Songti SC\", serif",
      cssUrl: "https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;600;900&display=swap"
    },
    {
      label: "Noto Sans SC",
      family: "\"Noto Sans SC\", \"PingFang SC\", sans-serif",
      cssUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap"
    },
    {
      label: "IBM Plex Mono",
      family: "\"IBM Plex Mono\", ui-monospace, monospace",
      cssUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&display=swap"
    }
  ],

  elements: [
    {
      id: "index",
      type: "text",
      content: "01 / PRIVATE",
      x: 94,
      y: 92,
      width: 260,
      height: 40,
      rotation: 0,
      z: 4,
      className: "micro-label",
      style: {
        fontFamily: "\"IBM Plex Mono\", ui-monospace, monospace",
        fontSize: "17px",
        fontWeight: "500",
        lineHeight: "1.2",
        letterSpacing: "0.12em",
        textAlign: "left",
        color: "#991F24",
        opacity: "1"
      }
    },

    {
      id: "main",
      type: "text",
      content: "我想把一些\n没有寄出去的话\n重新折好。",
      x: 95,
      y: 280,
      width: 690,
      height: 430,
      rotation: -1.2,
      z: 5,
      className: "main-letter",
      style: {
        fontFamily: "\"Noto Serif SC\", \"Songti SC\", serif",
        fontSize: "74px",
        fontWeight: "600",
        lineHeight: "1.48",
        letterSpacing: "0.035em",
        textAlign: "left",
        color: "#161616",
        opacity: "1"
      }
    },

    {
      id: "note",
      type: "text",
      content: "有些话并没有过期，\n只是失去了合适的收件人。",
      x: 102,
      y: 830,
      width: 430,
      height: 120,
      rotation: 0,
      z: 5,
      style: {
        fontFamily: "\"Noto Sans SC\", \"PingFang SC\", sans-serif",
        fontSize: "22px",
        fontWeight: "300",
        lineHeight: "1.85",
        letterSpacing: "0.08em",
        textAlign: "left",
        color: "#383735",
        opacity: "0.74"
      }
    },

    {
      id: "bracket",
      type: "text",
      content: "（",
      x: 760,
      y: 650,
      width: 300,
      height: 430,
      rotation: 8,
      z: 1,
      className: "bleed-mark",
      style: {
        fontFamily: "\"Noto Serif SC\", serif",
        fontSize: "390px",
        fontWeight: "400",
        lineHeight: "1",
        letterSpacing: "0",
        color: "#991F24",
        opacity: "0.08"
      }
    },

    {
      id: "rule",
      type: "shape",
      shape: "rect",
      x: 98,
      y: 1188,
      width: 330,
      height: 7,
      rotation: 0,
      z: 3,
      style: {
        background: "#991F24",
        opacity: "1",
        borderRadius: "0px"
      }
    },

    {
      id: "footer",
      type: "text",
      content: "22.09.2026  /  UNSENT",
      x: 98,
      y: 1235,
      width: 360,
      height: 30,
      rotation: 0,
      z: 4,
      style: {
        fontFamily: "\"IBM Plex Mono\", ui-monospace, monospace",
        fontSize: "14px",
        fontWeight: "400",
        lineHeight: "1.2",
        letterSpacing: "0.16em",
        textAlign: "left",
        color: "#161616",
        opacity: "0.62"
      }
    }
  ]
};
