export function timeAgo(date) {
  const s = Math.floor((Date.now() - date) / 1000);

  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;

  return `${Math.floor(s / 3600)}h ago`;
}