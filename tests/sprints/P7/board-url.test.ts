import { test } from "node:test";
import assert from "node:assert/strict";
import { boardSearchUrl, boardSearchWords } from "../../../lib/format.ts";

test("search words are encoded into the board template", () => {
  assert.equal(
    boardSearchUrl("https://ph.jobstreet.com/jobs?keywords={q}", "Sun Life intern"),
    "https://ph.jobstreet.com/jobs?keywords=Sun%20Life%20intern",
  );
});

test("characters that could break the query are encoded", () => {
  assert.equal(boardSearchUrl("https://x.test/?q={q}", "AT&T #1 intern"), "https://x.test/?q=AT%26T%20%231%20intern");
});

test("extra spaces are trimmed", () => {
  assert.equal(boardSearchUrl("https://x.test/?q={q}", "  DSV intern "), "https://x.test/?q=DSV%20intern");
});

test("country and legal suffixes are dropped from the search words", () => {
  assert.equal(boardSearchWords("Sun Life Global Solutions Philippines, Inc."), "Sun Life Global Solutions intern");
  assert.equal(boardSearchWords("Henkel Philippines"), "Henkel intern");
  assert.equal(boardSearchWords("DENSO TEN Solutions Philippines Corporation"), "DENSO TEN Solutions intern");
  assert.equal(boardSearchWords("Coca-Cola Europacific Partners"), "Coca-Cola Europacific Partners intern");
});

test("a name made only of suffixes falls back to the full name", () => {
  assert.equal(boardSearchWords("Philippines Inc."), "Philippines Inc. intern");
});
