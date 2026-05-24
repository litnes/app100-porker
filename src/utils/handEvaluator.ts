import { HandRank } from '../types/poker';
import type { Card, HandResult, Rank } from '../types/poker';

const RANK_VALUES: Record<Rank, number> = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8,
  '9': 9, '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
};

export function evaluateHand(cards: Card[]): HandResult {
  const values = cards.map(c => RANK_VALUES[c.rank]).sort((a, b) => b - a);
  const suits = cards.map(c => c.suit);

  const isFlush = suits.every(s => s === suits[0]);

  const uniqueValues = [...new Set(values)];
  const isNormalStraight = uniqueValues.length === 5 && values[0] - values[4] === 4;
  const isAceLowStraight =
    values[0] === 14 && values[1] === 5 && values[2] === 4 && values[3] === 3 && values[4] === 2;
  const isStraight = isNormalStraight || isAceLowStraight;

  const rankCounts: Record<number, number> = {};
  for (const v of values) {
    rankCounts[v] = (rankCounts[v] || 0) + 1;
  }
  const counts = Object.values(rankCounts).sort((a, b) => b - a);

  let handRank: HandRank;
  let name: string;

  const isRoyalFlush =
    isFlush && values[0] === 14 && values[1] === 13 && values[2] === 12 && values[3] === 11 && values[4] === 10;

  if (isRoyalFlush) {
    handRank = HandRank.ROYAL_FLUSH;
    name = 'Royal Flush';
  } else if (isFlush && isStraight) {
    handRank = HandRank.STRAIGHT_FLUSH;
    name = 'Straight Flush';
  } else if (counts[0] === 4) {
    handRank = HandRank.FOUR_OF_A_KIND;
    name = 'Four of a Kind';
  } else if (counts[0] === 3 && counts[1] === 2) {
    handRank = HandRank.FULL_HOUSE;
    name = 'Full House';
  } else if (isFlush) {
    handRank = HandRank.FLUSH;
    name = 'Flush';
  } else if (isStraight) {
    handRank = HandRank.STRAIGHT;
    name = 'Straight';
  } else if (counts[0] === 3) {
    handRank = HandRank.THREE_OF_A_KIND;
    name = 'Three of a Kind';
  } else if (counts[0] === 2 && counts[1] === 2) {
    handRank = HandRank.TWO_PAIR;
    name = 'Two Pair';
  } else if (counts[0] === 2) {
    handRank = HandRank.ONE_PAIR;
    name = 'One Pair';
  } else {
    handRank = HandRank.HIGH_CARD;
    name = 'High Card';
  }

  // Sort by count desc, then value desc for tiebreaking
  const sortedByCount = Object.entries(rankCounts)
    .sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      return parseInt(b[0]) - parseInt(a[0]);
    })
    .map(([v]) => parseInt(v));

  // let score = handRank * 100_000_000; // bug: Ace-high tiebreak (~1.4B) exceeds this separator
  let score = handRank * 2_000_000_000;
  for (let i = 0; i < sortedByCount.length; i++) {
    score += sortedByCount[i] * Math.pow(100, sortedByCount.length - 1 - i);
  }

  return { rank: handRank, name, score };
}

export function compareHands(playerHand: Card[], cpuHand: Card[]): number {
  return evaluateHand(playerHand).score - evaluateHand(cpuHand).score;
}

export function getCpuDiscards(hand: Card[]): number[] {
  const result = evaluateHand(hand);
  if (result.rank >= HandRank.THREE_OF_A_KIND) return [];

  const rankCounts: Record<string, number> = {};
  for (const card of hand) {
    rankCounts[card.rank] = (rankCounts[card.rank] || 0) + 1;
  }

  const discards: number[] = [];
  for (let i = 0; i < hand.length; i++) {
    if (rankCounts[hand[i].rank] === 1 && RANK_VALUES[hand[i].rank] < 12) {
      discards.push(i);
      if (discards.length >= 3) break;
    }
  }
  return discards;
}
