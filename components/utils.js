export const cls = (...c) => c.filter(Boolean).join(" ");

export function timeAgo(date) {
  const d = typeof date === "string" || typeof date === "number" ? new Date(date) : date;
  const sec = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });
  const units = [
    ["seconds", 1],
    ["minutes", 60],
    ["hours", 3600],
    ["days", 86400],
    ["weeks", 604800],
    ["months", 2629800],
    ["years", 31557600],
  ];
  let unit = "seconds";
  let div = 1;
  for (const [u, secondsInUnit] of units) {
    if (sec >= secondsInUnit) {
      unit = u;
      div = secondsInUnit;
    }
  }
  const value = -Math.floor(sec / div);
  return rtf.format(value, /** @type {Intl.RelativeTimeFormatUnit} */ (unit));
}

export const makeId = (p) => `${p}${Math.random().toString(36).slice(2, 10)}`;
