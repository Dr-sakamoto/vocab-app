// 毎日のリマインダーを、端末のカレンダーに登録できる .ics として作る。
//
// プッシュ通知は送信サーバーと購読の保存が要り、iOS ではホーム画面に
// 追加した PWA でしか届かない。習慣化に要るのは「思い出すきっかけ」なので、
// どの端末でも確実に鳴る OS のカレンダー通知に任せる（サーバー不要）。

/** "HH:MM" を検証して [時, 分] にする。不正なら null。 */
export function parseReminderTime(value: string): [number, number] | null {
  const m = /^(\d{2}):(\d{2})$/.exec(value);
  if (!m) return null;
  const hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  return [hour, minute];
}

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/** ローカル時刻のまま（タイムゾーン指定なし＝端末の時刻で）書く "YYYYMMDDTHHMMSS" */
function floatingDateTime(date: Date, hour: number, minute: number): string {
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(hour)}${pad(minute)}00`;
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
}

/**
 * 毎日決まった時刻に5分間の予定と、その開始時の通知を作る。
 * 時刻はタイムゾーンを付けない「その土地の時刻」で書くので、
 * 旅行先でも端末の時刻どおりに鳴る。
 */
export function buildReminderIcs({
  time,
  url,
  now,
}: {
  time: string;
  url: string;
  now: Date;
}): string {
  const parsed = parseReminderTime(time);
  if (!parsed) throw new Error(`invalid reminder time: ${time}`);
  const [hour, minute] = parsed;
  const endMinute = minute + 5;
  const endHour = hour + Math.floor(endMinute / 60);

  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//vocab-app//daily reminder//JA",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:vocab-daily-${utcStamp(now)}@vocab-app`,
    `DTSTAMP:${utcStamp(now)}`,
    `DTSTART:${floatingDateTime(now, hour, minute)}`,
    // 23:55 以降は翌日にまたがらないよう、終わりを 23:59 で止める
    `DTEND:${floatingDateTime(now, Math.min(endHour, 23), endHour > 23 ? 59 : endMinute % 60)}`,
    "RRULE:FREQ=DAILY",
    "SUMMARY:英単語 1セット（10問）",
    `DESCRIPTION:10問だけ。開くだけでいい。\\n${url}`,
    `URL:${url}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    "DESCRIPTION:英単語 1セット（10問）",
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
