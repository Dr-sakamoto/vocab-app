import assert from "node:assert/strict";
import test from "node:test";

import { createSyncRunner } from "../lib/syncRunner.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

test("runs the sync and reports that it started one", async () => {
  let calls = 0;
  const runner = createSyncRunner(async () => {
    calls += 1;
  });

  assert.equal(await runner.run(), true);
  assert.equal(calls, 1);
});

test("does not start a second sync while one is in flight", async () => {
  const gate = deferred();
  let calls = 0;
  const runner = createSyncRunner(async () => {
    calls += 1;
    await gate.promise;
  });

  const first = runner.run();
  const second = runner.run();
  const third = runner.run({ force: true });

  gate.resolve();

  assert.equal(await first, true);
  assert.equal(await second, false);
  assert.equal(await third, false);
  assert.equal(calls, 1);
});

test("skips an auto sync inside the minimum interval, but not a forced one", async () => {
  let calls = 0;
  let clock = 0;
  const runner = createSyncRunner(
    async () => {
      calls += 1;
    },
    { minIntervalMs: 5000, now: () => clock },
  );

  assert.equal(await runner.run(), true);

  clock = 4999;
  assert.equal(await runner.run(), false);
  assert.equal(calls, 1);

  assert.equal(await runner.run({ force: true }), true);
  assert.equal(calls, 2);
});

test("lets an auto sync through once the minimum interval has passed", async () => {
  let calls = 0;
  let clock = 0;
  const runner = createSyncRunner(
    async () => {
      calls += 1;
    },
    { minIntervalMs: 5000, now: () => clock },
  );

  await runner.run();
  clock = 5000;
  assert.equal(await runner.run(), true);
  assert.equal(calls, 2);
});

test("a failing sync neither rejects the caller nor wedges the runner", async () => {
  let calls = 0;
  const runner = createSyncRunner(async () => {
    calls += 1;
    throw new Error("offline");
  });

  assert.equal(await runner.run(), true);
  assert.equal(runner.isRunning(), false);
  assert.equal(await runner.run(), true);
  assert.equal(calls, 2);
});

test("a sync that throws synchronously still clears the in-flight slot", async () => {
  let calls = 0;
  const runner = createSyncRunner(() => {
    calls += 1;
    throw new Error("boom");
  });

  await runner.run();
  assert.equal(runner.isRunning(), false);
  await runner.run();
  assert.equal(calls, 2);
});
