export const PARIS_TIME_ZONE = "Europe/Paris";

function getParisParts(date: Date) {
  const parts = new Intl.DateTimeFormat("fr-FR", {
    timeZone: PARIS_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  return Object.fromEntries(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value]),
  ) as Record<string, string>;
}

export function toDateTimeInput(value: string | null) {
  if (!value) {
    return "";
  }

  const parts = getParisParts(new Date(value));
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}`;
}

function getParisOffsetMs(date: Date) {
  const parts = getParisParts(date);
  const parisAsUtc = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second),
  );

  return parisAsUtc - date.getTime();
}

export function parisDateTimeInputToIso(value: string) {
  const match = value.match(
    /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/,
  );

  if (!match) {
    return "";
  }

  const [, year, month, day, hour, minute] = match.map(Number);
  const localAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0);
  let utcDate = new Date(localAsUtc - getParisOffsetMs(new Date(localAsUtc)));

  utcDate = new Date(localAsUtc - getParisOffsetMs(utcDate));
  const iso = utcDate.toISOString();
  return toDateTimeInput(iso) === value ? iso : "";
}

export function currentParisDateTimeInput() {
  return toDateTimeInput(new Date().toISOString());
}
