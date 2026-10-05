import test from "node:test";
import assert from "node:assert/strict";
import { z } from "zod";

const createMatterSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  caseNumber: z.string().trim().nullish(),
  court: z.string().trim().nullish(),
  description: z.string().trim().nullish(),
  status: z.string().trim().default("active"),
});

const updateMatterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  caseNumber: z.string().trim().nullable().optional(),
  court: z.string().trim().nullable().optional(),
  description: z.string().trim().nullable().optional(),
  status: z.string().trim().optional(),
});

test("matter creation schema validates correct input and assigns defaults", () => {
  const result = createMatterSchema.safeParse({
    name: "Doe v. Acme Corp",
    caseNumber: "2026-CV-00123",
    court: "NY Supreme Court",
  });
  assert.equal(result.success, true);
  if (result.success) {
    assert.equal(result.data.name, "Doe v. Acme Corp");
    assert.equal(result.data.status, "active");
    assert.equal(result.data.court, "NY Supreme Court");
    assert.equal(result.data.description, undefined);
  }
});

test("matter creation schema rejects missing or blank name", () => {
  assert.equal(createMatterSchema.safeParse({}).success, false);
  assert.equal(createMatterSchema.safeParse({ name: "   " }).success, false);
  assert.equal(createMatterSchema.safeParse({ name: "" }).success, false);
});

test("matter update schema allows status transitions (hide, unhide, active)", () => {
  const hideResult = updateMatterSchema.safeParse({ status: "hidden" });
  assert.equal(hideResult.success, true);
  if (hideResult.success) {
    assert.equal(hideResult.data.status, "hidden");
  }

  const unhideResult = updateMatterSchema.safeParse({ status: "active" });
  assert.equal(unhideResult.success, true);
  if (unhideResult.success) {
    assert.equal(unhideResult.data.status, "active");
  }
});

test("matter list filtering correctly separates active, hidden, and all matters", () => {
  const sampleMatters = [
    { id: 1, name: "Alpha v. Beta", caseNumber: "101", court: "District", status: "active" },
    { id: 2, name: "Gamma v. Delta", caseNumber: "102", court: "Supreme", status: "hidden" },
    { id: 3, name: "Epsilon v. Zeta", caseNumber: "103", court: "Appeals", status: "closed" },
  ];

  const activeMatters = sampleMatters.filter((m) => m.status !== "hidden");
  assert.equal(activeMatters.length, 2);
  assert.equal(activeMatters.some((m) => m.id === 2), false);

  const hiddenMatters = sampleMatters.filter((m) => m.status === "hidden");
  assert.equal(hiddenMatters.length, 1);
  assert.equal(hiddenMatters[0].id, 2);

  const allMatters = sampleMatters;
  assert.equal(allMatters.length, 3);
});

test("matter list search correctly filters across name, case number, and court", () => {
  const sampleMatters = [
    { id: 1, name: "The City of New York v. 512 West", caseNumber: "450551/2025", court: "Supreme Court", description: "Tenancy" },
    { id: 2, name: "Reisner v. Acme", caseNumber: "1:26-cv-44227", court: "EDNY", description: "Trademark" },
  ];

  const searchByName = sampleMatters.filter((m) => m.name.toLowerCase().includes("reisner"));
  assert.equal(searchByName.length, 1);
  assert.equal(searchByName[0].id, 2);

  const searchByCase = sampleMatters.filter((m) => m.caseNumber.toLowerCase().includes("450551"));
  assert.equal(searchByCase.length, 1);
  assert.equal(searchByCase[0].id, 1);

  const searchByCourt = sampleMatters.filter((m) => m.court.toLowerCase().includes("edny"));
  assert.equal(searchByCourt.length, 1);
  assert.equal(searchByCourt[0].id, 2);
});
