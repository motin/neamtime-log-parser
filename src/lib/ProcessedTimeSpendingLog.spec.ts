import test, { ExecutionContext } from "ava";
import { parseTimeLog } from "./parse";

/**
 * Tests for client/project/category parsing from frontmatter and .:: category tags.
 * These tests verify that entries correctly inherit client/project values
 * when parsing logs with multiple sessions.
 */

test("single session with frontmatter should have client/project on entries", (t: ExecutionContext) => {
  const content = `---
client: The Resistance
project: CW
work_type: Indiehacking
---

start 2025-11-24 (+0200) 09:47

2025-11-24 (+0200) 09:50, some work entry
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 1);
  t.is(result.entries[0].client, "The Resistance");
  t.is(result.entries[0].project, "CW");
});

test("single session with .:: tag should have client/project on entries", (t: ExecutionContext) => {
  const content = `
.:: Foo / Bar

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, some work entry
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 1);
  t.is(result.entries[0].client, "Foo");
  t.is(result.entries[0].project, "Bar");
});

test("multiple sessions with frontmatter should have client/project on all entries", (t: ExecutionContext) => {
  const content = `---
client: The Resistance
project: CW
---

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, first session work
paus->2025-12-18 (+0200) 11:48

start 2025-12-20 (+0200) 07:40ca

2025-12-20 (+0200) 08:00, second session work
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 2);

  // First session entry
  t.is(result.entries[0].client, "The Resistance");
  t.is(result.entries[0].project, "CW");

  // Second session entry - should also have client/project
  t.is(result.entries[1].client, "The Resistance");
  t.is(result.entries[1].project, "CW");
});

test("multiple sessions with .:: tag should have client/project on all entries", (t: ExecutionContext) => {
  const content = `
.:: Foo / Bar

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, first session work
paus->2025-12-18 (+0200) 11:48

start 2025-12-20 (+0200) 07:40ca

2025-12-20 (+0200) 08:00, second session work
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 2);

  // First session entry
  t.is(result.entries[0].client, "Foo");
  t.is(result.entries[0].project, "Bar");

  // Second session entry - should also have client/project from .:: tag
  t.is(result.entries[1].client, "Foo");
  t.is(result.entries[1].project, "Bar");
});

test("multiple sessions with .:: tag appearing before first session should propagate to all sessions", (t: ExecutionContext) => {
  const content = `
.:: TestClient / TestProject

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, merged PR
paus->2025-12-18 (+0200) 11:48

start 2025-12-19 (+0200) 10:00

2025-12-19 (+0200) 10:30, second day work
paus->2025-12-19 (+0200) 11:00

start 2025-12-20 (+0200) 07:40ca

2025-12-20 (+0200) 08:00, third session work
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 3);

  // All entries should have the same client/project
  result.entries.forEach((entry, index) => {
    t.is(entry.client, "TestClient", `Entry ${index} should have client`);
    t.is(entry.project, "TestProject", `Entry ${index} should have project`);
  });
});

test("full category tag format (.:: Client / Project : Category) should parse all fields", (t: ExecutionContext) => {
  const content = `
.:: Client / Project : MyCategory

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, some work entry
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 1);
  t.is(result.entries[0].client, "Client");
  t.is(result.entries[0].project, "Project");
  t.is(result.entries[0].category, "MyCategory");
});

test("frontmatter with .:: tag override should use .:: tag values", (t: ExecutionContext) => {
  const content = `---
client: DefaultClient
project: DefaultProject
default_category: DefaultCategory
---

.:: OverrideClient / OverrideProject

start 2025-12-18 (+0200) 11:25ca

2025-12-18 (+0200) 11:29, some work entry
paus->
`;

  const result = parseTimeLog(content, { timezone: "UTC" });

  t.is(result.status, "OK");
  t.is(result.entries.length, 1);
  // Category tag should override frontmatter for client/project
  t.is(result.entries[0].client, "OverrideClient");
  t.is(result.entries[0].project, "OverrideProject");
  // Category should fall back to frontmatter default_category
  t.is(result.entries[0].category, "DefaultCategory");
});
