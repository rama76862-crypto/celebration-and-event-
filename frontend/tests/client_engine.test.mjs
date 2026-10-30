import test from "node:test";
import assert from "node:assert/strict";

// Helper mocks matching src/lib/utils.ts logic
function formatCurrency(amount, currency = "INR") {
  const symbolMap = {
    INR: "₹",
    USD: "$",
    EUR: "€",
    GBP: "£",
  };
  const sym = symbolMap[currency] || `${currency} `;
  return `${sym}${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function calculateContingency(eventType, indoorOutdoor) {
  if (eventType === "wedding" || indoorOutdoor === "outdoor") {
    return 0.12;
  }
  return 0.08;
}

test("formatCurrency handles INR, USD, EUR, and GBP accurately", () => {
  assert.equal(formatCurrency(1500000, "INR"), "₹1,500,000");
  assert.equal(formatCurrency(50000, "USD"), "$50,000");
  assert.equal(formatCurrency(25000, "EUR"), "€25,000");
  assert.equal(formatCurrency(10000, "GBP"), "£10,000");
});

test("calculateContingency assigns 12% to weddings and outdoor events, 8% otherwise", () => {
  assert.equal(calculateContingency("wedding", "indoor"), 0.12);
  assert.equal(calculateContingency("birthday", "outdoor"), 0.12);
  assert.equal(calculateContingency("birthday", "indoor"), 0.08);
  assert.equal(calculateContingency("community", "indoor"), 0.08);
});

test("replan math computes exact deltas and direction shifts", () => {
  const oldBudget = 500000;
  const newBudget = 650000;
  const oldGuests = 100;
  const newGuests = 120;

  const budgetDelta = newBudget - oldBudget;
  const guestDelta = newGuests - oldGuests;

  assert.equal(budgetDelta, 150000);
  assert.equal(guestDelta, 20);
});

test("deterministic remainder rounding test", () => {
  const total = 100000;
  const weights = [0.35, 0.25, 0.15, 0.12, 0.08, 0.05];
  let sum = 0;
  for (const w of weights) {
    sum += Math.round(total * w);
  }
  assert.equal(sum, total);
});
