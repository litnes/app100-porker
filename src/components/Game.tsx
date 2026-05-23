import { useState, useCallback } from 'react';
import type { Card, GamePhase, GameResult } from '../types/poker';
import { createDeck, shuffleDeck } from '../utils/deck';
import { evaluateHand, compareHands, getCpuDiscards } from '../utils/handEvaluator';
import { soundDeal, soundDraw, soundWin, soundLose, soundTie, soundBet, soundCardSelect, soundCardDeselect } from '../utils/sound';
import Hand from './Hand';

const INITIAL_CHIPS = 1000;
const BET_OPTIONS = [10, 25, 50, 100];

export default function Game() {
  const [playerChips, setPlayerChips] = useState(INITIAL_CHIPS);
  const [cpuChips, setCpuChips] = useState(INITIAL_CHIPS);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [cpuHand, setCpuHand] = useState<Card[]>([]);
  const [deck, setDeck] = useState<Card[]>([]);
  const [pot, setPot] = useState(0);
  const [currentBet, setCurrentBet] = useState(0);
  const [phase, setPhase] = useState<GamePhase>('idle');
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [gameResult, setGameResult] = useState<GameResult | null>(null);
  const [message, setMessage] = useState('');

  const startGame = useCallback((bet: number) => {
    if (playerChips < bet || cpuChips < bet) return;

    const newDeck = shuffleDeck(createDeck());
    const pHand = newDeck.slice(0, 5);
    const cHand = newDeck.slice(5, 10);
    const remaining = newDeck.slice(10);

    setDeck(remaining);
    setPlayerHand(pHand);
    setCpuHand(cHand);
    setCurrentBet(bet);
    setPot(bet * 2);
    setPlayerChips(c => c - bet);
    setCpuChips(c => c - bet);
    setSelectedCards(new Set());
    setGameResult(null);
    setPhase('draw');
    soundBet();
    soundDeal();
    setMessage('捨てたいカードを選んで「交換する」を押してください（最大3枚）');
  }, [playerChips, cpuChips]);

  const toggleCard = useCallback((index: number) => {
    if (phase !== 'draw') return;
    setSelectedCards(prev => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
        soundCardDeselect();
      } else if (next.size < 3) {
        next.add(index);
        soundCardSelect();
      }
      return next;
    });
  }, [phase]);

  const drawCards = useCallback(() => {
    if (phase !== 'draw') return;

    let currentDeck = [...deck];

    // Player draws
    const newPlayerHand = playerHand.map((card, i) => {
      if (selectedCards.has(i)) {
        const newCard = currentDeck.shift()!;
        return newCard;
      }
      return card;
    });

    // CPU draws
    const cpuDiscards = getCpuDiscards(cpuHand);
    const newCpuHand = cpuHand.map((card, i) => {
      if (cpuDiscards.includes(i)) {
        return currentDeck.shift()!;
      }
      return card;
    });

    setPlayerHand(newPlayerHand);
    setCpuHand(newCpuHand);
    setDeck(currentDeck);
    setSelectedCards(new Set());
    setPhase('showdown');
    soundDraw();

    // Determine result
    const diff = compareHands(newPlayerHand, newCpuHand);
    let result: GameResult;
    let msg: string;

    if (diff > 0) {
      result = 'player';
      msg = `あなたの勝ち！ +${pot} チップ獲得！`;
      setPlayerChips(c => c + pot);
      soundWin();
    } else if (diff < 0) {
      result = 'cpu';
      msg = `CPUの勝ち！ ${pot} チップを失いました`;
      setCpuChips(c => c + pot);
      soundLose();
    } else {
      result = 'tie';
      msg = '引き分け！チップが返ってきます';
      setPlayerChips(c => c + currentBet);
      setCpuChips(c => c + currentBet);
      soundTie();
    }

    setGameResult(result);
    setMessage(msg);
    setPhase('result');
  }, [phase, deck, playerHand, cpuHand, selectedCards, pot, currentBet]);

  const reset = useCallback(() => {
    setPhase('idle');
    setPlayerHand([]);
    setCpuHand([]);
    setSelectedCards(new Set());
    setGameResult(null);
    setMessage('');
    setPot(0);
  }, []);

  const isGameOver = playerChips === 0 || cpuChips === 0;
  const playerHandResult = playerHand.length === 5 ? evaluateHand(playerHand) : null;
  const cpuHandResult = cpuHand.length === 5 ? evaluateHand(cpuHand) : null;

  return (
    <div className="game">
      <div className="game-header">
        <div className="chip-display cpu-chips">
          <span className="chip-icon">🎰</span>
          <span>CPU: {cpuChips} chips</span>
        </div>
        <div className="game-title">5 CARD DRAW POKER</div>
        <div className="chip-display player-chips">
          <span className="chip-icon">💰</span>
          <span>あなた: {playerChips} chips</span>
        </div>
      </div>

      <div className="table">
        {/* CPU Hand */}
        {cpuHand.length > 0 && (
          <Hand
            cards={cpuHand}
            faceDown={phase !== 'result'}
            label="CPU"
            handName={phase === 'result' && cpuHandResult ? cpuHandResult.name : undefined}
          />
        )}

        {/* Pot display */}
        {pot > 0 && (
          <div className={`pot-display${gameResult ? ` result-${gameResult}` : ''}`}>
            {phase === 'result' ? (
              <span className="result-message">{message}</span>
            ) : (
              <span>POT: {pot} chips</span>
            )}
          </div>
        )}

        {/* Player Hand */}
        {playerHand.length > 0 && (
          <Hand
            cards={playerHand}
            selectedIndices={phase === 'draw' ? selectedCards : undefined}
            onCardClick={phase === 'draw' ? toggleCard : undefined}
            label="あなた"
            handName={phase === 'result' && playerHandResult ? playerHandResult.name : undefined}
          />
        )}
      </div>

      {/* Controls */}
      <div className="controls">
        {phase === 'idle' && (
          <div className="betting-area">
            {isGameOver ? (
              <div className="game-over">
                <p>{playerChips === 0 ? 'ゲームオーバー！チップが無くなりました' : 'おめでとう！CPUに勝ちました！'}</p>
                <button className="btn btn-primary" onClick={() => {
                  setPlayerChips(INITIAL_CHIPS);
                  setCpuChips(INITIAL_CHIPS);
                  reset();
                }}>
                  新しいゲーム
                </button>
              </div>
            ) : (
              <>
                <p className="bet-prompt">ベット額を選んでください</p>
                <div className="bet-buttons">
                  {BET_OPTIONS.map(bet => (
                    <button
                      key={bet}
                      className="btn btn-bet"
                      disabled={playerChips < bet || cpuChips < bet}
                      onClick={() => startGame(bet)}
                    >
                      {bet}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {phase === 'draw' && (
          <div className="draw-area">
            <p className="draw-hint">
              {selectedCards.size > 0
                ? `${selectedCards.size}枚選択中（最大3枚）`
                : '捨てるカードを選択（0〜3枚）'}
            </p>
            <button className="btn btn-primary" onClick={drawCards}>
              {selectedCards.size === 0 ? '交換しない（そのまま）' : `${selectedCards.size}枚交換する`}
            </button>
          </div>
        )}

        {phase === 'result' && (
          <div className="result-area">
            <button className="btn btn-primary" onClick={reset}>
              次のラウンド
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
