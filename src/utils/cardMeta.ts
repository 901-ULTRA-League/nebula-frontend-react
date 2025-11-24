import type { Card } from "../types";

const SEMI_TRANSCENDENT_NUMBERS = new Set(["PR-107"]);
const TRANSCENDENT_NUMBERS = new Set(["BP01-022", "AP(06/20) BP01-022", "BP01-026"].map((n) => n.toUpperCase()));

const normalizeNumber = (card: Card) => card.number?.toUpperCase();

export const isSemiTranscendent = (card: Card) => {
  const num = card.number?.toUpperCase();
  return !!num && SEMI_TRANSCENDENT_NUMBERS.has(num);
};

export const isTranscendent = (card: Card) => {
  const num = normalizeNumber(card);
  return !!num && TRANSCENDENT_NUMBERS.has(num);
};
