import assert from "node:assert/strict";
import test from "node:test";

import { buildReminderIcs, parseReminderTime } from "../lib/reminderCalendar.js";

const now = new Date(2026, 9, 21, 10, 0, 0);

test("時刻の検証", () => {
  assert.deepEqual(parseReminderTime("20:30"), [20, 30]);
  assert.equal(parseReminderTime("24:00"), null);
  assert.equal(parseReminderTime("8:30"), null);
  assert.equal(parseReminderTime(""), null);
});

test("毎日繰り返す予定と、開始時の通知を作る", () => {
  const ics = buildReminderIcs({ time: "20:30", url: "https://example.com/", now });
  assert.match(ics, /^BEGIN:VCALENDAR\r\n/);
  assert.match(ics, /\r\nDTSTART:20261021T203000\r\n/);
  assert.match(ics, /\r\nDTEND:20261021T203500\r\n/);
  assert.match(ics, /\r\nRRULE:FREQ=DAILY\r\n/);
  assert.match(ics, /\r\nBEGIN:VALARM\r\nACTION:DISPLAY\r\n/);
  assert.match(ics, /\r\nTRIGGER:PT0M\r\n/);
  assert.match(ics, /\r\nURL:https:\/\/example\.com\/\r\n/);
  assert.match(ics, /END:VCALENDAR\r\n$/);
});

test("時刻はタイムゾーンを付けない（端末の時刻で鳴る）", () => {
  const ics = buildReminderIcs({ time: "07:00", url: "https://example.com/", now });
  assert.ok(!/DTSTART;TZID|DTSTART:\d{8}T\d{6}Z/.test(ics));
});

test("日付をまたぐ時刻でも終わりは同じ日に収める", () => {
  const ics = buildReminderIcs({ time: "23:58", url: "https://example.com/", now });
  assert.match(ics, /\r\nDTEND:20261021T235900\r\n/);
  const ics2 = buildReminderIcs({ time: "22:57", url: "https://example.com/", now });
  assert.match(ics2, /\r\nDTEND:20261021T230200\r\n/);
});

test("不正な時刻は作らない", () => {
  assert.throws(() => buildReminderIcs({ time: "25:00", url: "x", now }));
});
