import { test } from "node:test";
import assert from "node:assert/strict";
import { daysAgo, postedAgo } from "../../../lib/format.ts";

// 2026-10-24 01:30 in Manila is still 2026-10-23 in UTC: dates must follow Manila
const now = new Date("2026-10-23T17:30:00Z");
const tz = "Asia/Manila";

test("days ago counts from today in Manila, not UTC", () => {
  assert.equal(daysAgo(0, tz, now), "2026-10-24");
  assert.equal(daysAgo(7, tz, now), "2026-10-17");
});

test("posted label", () => {
  assert.equal(postedAgo("2026-10-24", tz, now), "Posted today");
  assert.equal(postedAgo("2026-10-23", tz, now), "Posted yesterday");
  assert.equal(postedAgo("2026-10-14", tz, now), "Posted 10d ago");
  assert.equal(postedAgo(null, tz, now), null);
});
