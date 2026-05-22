import type { Card, Suit } from '../types/poker';

const SUIT_SYMBOLS: Record<Suit, string> = {
  spades: '♠',
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
};

interface Props {
  card: Card;
  faceDown?: boolean;
  selected?: boolean;
  onClick?: () => void;
}

export default function CardComponent({ card, faceDown = false, selected = false, onClick }: Props) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds';
  const symbol = SUIT_SYMBOLS[card.suit];

  if (faceDown) {
    return (
      <div className="card card-back">
        <div className="card-back-pattern" />
      </div>
    );
  }

  return (
    <div
      className={`card card-face${isRed ? ' red' : ' black'}${selected ? ' selected' : ''}${onClick ? ' clickable' : ''}`}
      onClick={onClick}
    >
      <div className="card-corner top-left">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
      <div className="card-center">{symbol}</div>
      <div className="card-corner bottom-right">
        <span className="card-rank">{card.rank}</span>
        <span className="card-suit-small">{symbol}</span>
      </div>
      {selected && <div className="card-selected-label">捨てる</div>}
    </div>
  );
}
