export const HISTORY_MAX = 20;

export const STATUS_COLORS = {
  normal: {
    dot: "#639922",
    badge: {
      bg: "#EAF3DE",
      color: "#3B6D11",
    },
    label: "Normal",
  },
  warning: {
    dot: "#BA7517",
    badge: {
      bg: "#FAEEDA",
      color: "#854F0B",
    },
    label: "Warning",
  },
  critical: {
    dot: "#E24B4A",
    badge: {
      bg: "#FCEBEB",
      color: "#A32D2D",
    },
    label: (device) =>
      device === "unknown" ? "Unauthorized" : "Critical",
  },
};

export const SEVERITY_STYLES = {
  critical: {
    border: "#E24B4A",
    bg: "#FCEBEB",
    iconColor: "#A32D2D",
    icon: "⚠",
  },
  warning: {
    border: "#BA7517",
    bg: "#FAEEDA",
    iconColor: "#854F0B",
    icon: "⚡",
  },
  info: {
    border: "#378ADD",
    bg: "#E6F1FB",
    iconColor: "#185FA5",
    icon: "ℹ",
  },
};