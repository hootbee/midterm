import React, { useState, useEffect } from 'react';

const BidPredictionBox = ({ bids, currentPrice, endTime }) => {
  const [prediction, setPrediction] = useState(null);

  useEffect(() => {
    const calculatePrediction = () => {
      const now = new Date();
      const endMs = new Date(endTime).getTime();
      const nowMs = now.getTime();
      const timeLeftSec = (endMs - nowMs) / 1000;

      if (timeLeftSec <= 0) {
        setPrediction({ status: 'ended' });
        return;
      }

      const recentBidsLast60s = bids.filter(b => {
        const diffSec = (nowMs - new Date(b.timestamp).getTime()) / 1000;
        return diffSec <= 60;
      });
      const recentCount = recentBidsLast60s.length;

      const lastBid = bids.length > 0 ? bids[bids.length - 1] : null;
      const prevBid = bids.length > 1 ? bids[bids.length - 2] : null;

      const priceJump = lastBid && prevBid ? lastBid.amount - prevBid.amount : 0;

      let avgJump = 0;
      if (bids.length >= 2) {
        const jumps = [];
        for (let i = 1; i < bids.length; i++) {
          jumps.push(bids[i].amount - bids[i - 1].amount);
        }
        avgJump = jumps.reduce((a, b) => a + b, 0) / jumps.length;
      }

      let baseChance = 15;
      if (recentCount > 2) {
        baseChance = 90;
      } else if (recentCount === 2) {
        baseChance = 70;
      } else if (recentCount === 1) {
        baseChance = 50;
      }

      let timeBonus = 0;
      if (timeLeftSec <= 10) {
        timeBonus = 40;
      } else if (timeLeftSec <= 30) {
        timeBonus = 20;
      } else if (timeLeftSec <= 60) {
        timeBonus = 10;
      }

      const heatBonus = avgJump > 0 && priceJump >= avgJump * 1.5 ? 10 : 0;

      let chance = baseChance + timeBonus + heatBonus;
      chance = Math.max(0, Math.min(100, chance));

      let label = '😌 현재는 비교적 안정적인 상태입니다.';
      let colorTheme = 'stable';
      if (chance >= 80) {
        label = '🔥 지금 입찰 경쟁이 매우 치열합니다.';
        colorTheme = 'intense';
      } else if (chance >= 50) {
        label = '⚡ 입찰이 계속 이어질 가능성이 높습니다.';
        colorTheme = 'active';
      }

      let explanation = `최근 1분간 ${recentCount}건의 입찰이 있었고, 마감까지 ${Math.round(timeLeftSec)}초 남았습니다.`;
      if (heatBonus > 0) {
        explanation += ' 또한 직전 입찰이 평소보다 큰 폭으로 올랐습니다.';
      }

      setPrediction({
        status: 'active',
        chance,
        label,
        colorTheme,
        explanation,
      });
    };

    calculatePrediction();
    const interval = setInterval(calculatePrediction, 1000);

    return () => clearInterval(interval);
  }, [bids, endTime]);

  if (!prediction) {
    return null;
  }

  if (prediction.status === 'ended') {
    return (
      <div style={styles.endedContainer}>
        <p style={styles.endedText}>경매가 종료된 항목입니다.</p>
      </div>
    );
  }

  const { chance, label, colorTheme, explanation } = prediction;

  const themeStyles = {
    intense: {
      border: '2px solid #ef4444',
      backgroundColor: '#fff1f2',
      color: '#991b1b',
    },
    active: {
      border: '2px solid #facc15',
      backgroundColor: '#fffbeb',
      color: '#b45309',
    },
    stable: {
      border: '1px solid #94a3b8',
      backgroundColor: '#f8fafc',
      color: '#334155',
    },
  };

  return (
    <div style={{ ...styles.container, ...themeStyles[colorTheme] }}>
      <p style={{ ...styles.label, color: themeStyles[colorTheme].color }}>{label}</p>
      <p style={styles.chanceText}>
        10초 내 추가 입찰 가능성: <span style={styles.chanceNumber}>{chance}%</span>
      </p>
      <p style={styles.explanation}>{explanation}</p>
    </div>
  );
};

const styles = {
  container: {
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    margin: '20px 0',
  },
  label: {
    fontWeight: 'bold',
    fontSize: '1.1rem',
    margin: 0,
  },
  chanceText: {
    margin: 0,
    fontSize: '1rem',
  },
  chanceNumber: {
    fontSize: '1.4rem',
    fontWeight: 600,
  },
  explanation: {
    margin: 0,
    fontSize: '0.9rem',
    color: '#475569',
  },
  endedContainer: {
    borderRadius: '12px',
    padding: '20px',
    margin: '20px 0',
    border: '1px solid #e2e8f0',
    backgroundColor: '#f8fafc',
    textAlign: 'center',
  },
  endedText: {
    margin: 0,
    color: '#64748b',
    fontSize: '1rem',
  },
};

export default BidPredictionBox;
