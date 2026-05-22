import type { Card } from '../types/poker';
import CardComponent from './CardComponent';

interface Props {
  cards: Card[];
  faceDown?: boolean;
  selectedIndices?: Set<number>;
  onCardClick?: (index: number) => void;
  label: string;
  handName?: string;
}

export default function Hand({ cards, faceDown, selectedIndices, onCardClick, label, handName }: Props) {
  return (
    <div className="hand-container">
      <div className="hand-label">{label}</div>
      <div className="hand-cards">
        {cards.map((card, i) => (
          <CardComponent
            key={card.id}
            card={card}
            faceDown={faceDown}
            selected={selectedIndices?.has(i)}
            onClick={onCardClick ? () => onCardClick(i) : undefined}
          />
        ))}
      </div>
      {handName && <div className="hand-name">{handName}</div>}
    </div>
  );
}
