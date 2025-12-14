import type { Card } from "../types";

const SEMI_TRANSCENDENT_NUMBERS = new Set(["PR-107"]);
const TRANSCENDENT_NUMBERS = new Set(["BP01-022", "AP(06/20) BP01-022", "BP01-026"].map((n) => n.toUpperCase()));
const NO_LIMIT_NUMBERS = new Set(["PR-036", "PR-107"]);

const normalizeNumber = (card: Card) => card.number?.toUpperCase();

export const isSemiTranscendent = (card: Card) => {
  const num = normalizeNumber(card);
  return !!num && SEMI_TRANSCENDENT_NUMBERS.has(num);
};

export const isTranscendent = (card: Card) => {
  const num = normalizeNumber(card);
  return !!num && TRANSCENDENT_NUMBERS.has(num);
};

export const isNoLimit = (card: Card) => {
  const num = normalizeNumber(card);
  return !!num && NO_LIMIT_NUMBERS.has(num);
};
