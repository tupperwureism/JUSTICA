import assert from "node:assert/strict";
import test from "node:test";
import { HttpError } from "./http.ts";
import {
  rejectUnknownKeys,
  requireIsoTimestamp,
  requireSha256,
  requireUuid,
} from "./validation.ts";

test("identifier and digest validators accept canonical values", () => {
  const value = {
    id: "de305d54-75b4-431b-adb2-eb6b9e546014",
    digest: "a".repeat(64),
    at: "2026-07-27T10:15:30.000Z",
  };
  assert.equal(requireUuid(value, "id"), value.id);
  assert.equal(requireSha256(value, "digest"), value.digest);
  assert.equal(requireIsoTimestamp(value, "at"), value.at);
});
test("unknown provider fields are rejected", () => {
  assert.throws(
    () =>
      rejectUnknownKeys({ providerEventId: "event", rawBiometric: "forbidden" }, [
        "providerEventId",
      ]),
    (error) => error instanceof HttpError && error.code === "UNKNOWN_FIELD",
  );
});

test("noncanonical or uppercase evidence digests are rejected", () => {
  assert.throws(
    () => requireSha256({ digest: "A".repeat(64) }, "digest"),
    (error) => error instanceof HttpError && error.code === "INVALID_FIELD",
  );
});
