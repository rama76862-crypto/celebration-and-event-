import assert from "node:assert/strict";
import test from "node:test";

import {
  fetchEventPlan,
  fetchEventReplan,
  generateClientPlan,
  generateClientReplan,
} from "../src/lib/api";
import type { EventRequest } from "../src/lib/types";
import { formatCurrency } from "../src/lib/utils";

const baseRequest: EventRequest = {
  event_type: "birthday",
  title: "Neon Jubilee",
  guest_count: 50,
  total_budget: 150_001,
  currency: "INR",
  event_date: "2030-12-15",
  location: "Bengaluru",
  city_tier: "metro",
  preferences: {
    dietary: ["vegan"],
    indoor_outdoor: "indoor",
    priorities: ["decor", "music"],
    age_group: "adults",
  },
};

test("formatCurrency formats the production utility for supported currencies", () => {
  assert.equal(formatCurrency(1_500_000, "INR"), "₹1,500,000");
  assert.equal(formatCurrency(50_000, "USD"), "$50,000");
  assert.equal(formatCurrency(25_000, "EUR"), "€25,000");
  assert.equal(formatCurrency(10_000, "GBP"), "£10,000");
});

test("client fallback preserves the total budget after deterministic rounding", () => {
  const plan = generateClientPlan(baseRequest);
  const allocated = plan.budget.categories.reduce((sum, category) => sum + category.amount, 0)
    + plan.budget.contingency_amount;

  assert.equal(plan.budget.total_allocated, baseRequest.total_budget);
  assert.equal(allocated, baseRequest.total_budget);
  assert.equal(plan.budget.contingency_percentage, 8);
  assert.equal(plan.timeline.event_type, "birthday");
  assert.ok(plan.timeline.all_tasks_sorted.length > 0);
});

test("client fallback uses the higher contingency for outdoor celebrations", () => {
  const plan = generateClientPlan({
    ...baseRequest,
    event_type: "community",
    preferences: { ...baseRequest.preferences, indoor_outdoor: "outdoor" },
  });

  assert.equal(plan.budget.contingency_percentage, 12);
  assert.equal(plan.budget.total_allocated, baseRequest.total_budget);
});

test("client replan returns exact budget, guest, and date deltas", () => {
  const replan = generateClientReplan({
    original_request: baseRequest,
    new_budget: 200_001,
    new_guest_count: 65,
    new_event_date: "2031-01-14",
  });

  assert.equal(replan.diff.budget_delta, 50_000);
  assert.equal(replan.diff.guest_count_delta, 15);
  assert.equal(replan.diff.date_shift_days, 30);
  assert.equal(replan.new_plan.budget.total_allocated, 200_001);
});

test("fetchEventPlan uses the production fallback when the API is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  try {
    const plan = await fetchEventPlan(baseRequest);
    assert.equal(plan.request.title, baseRequest.title);
    assert.equal(plan.budget.total_allocated, baseRequest.total_budget);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("fetchEventReplan uses the production fallback when the API is unavailable", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => {
    throw new Error("network unavailable");
  };

  try {
    const replan = await fetchEventReplan({
      original_request: baseRequest,
      new_budget: 175_001,
      new_guest_count: 55,
    });
    assert.equal(replan.diff.budget_delta, 25_000);
    assert.equal(replan.diff.guest_count_delta, 5);
    assert.equal(replan.new_plan.budget.total_allocated, 175_001);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
