export function formatOrderWhen(
  iso: string,
  opts: { dateStyle?: Intl.DateTimeFormatOptions["dateStyle"] } = {},
) {
  const { dateStyle = "medium" } = opts;
  if (!iso) return "";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  return new Intl.DateTimeFormat(undefined, {
    dateStyle,
    timeStyle: "short",
  }).format(date);
}
