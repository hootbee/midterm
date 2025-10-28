import React, { useState, useEffect } from 'react';
import './CheerLayer.css';

export default function CheerLayer({ incomingCheer }) {
  const [flames, setFlames] = useState([]);
  const [sparks, setSparks] = useState([]);

  useEffect(() => {
    if (!incomingCheer) return;

    // 🔥 메인 불꽃 10~15개
    const newFlames = Array.from({ length: 10 + Math.floor(Math.random() * 5) }).map((_, i) => ({
      id: `flame-${Date.now()}-${i}`,
      left: 10 + Math.random() * 80,
      duration: 1.8 + Math.random() * 1.5,
      scale: 0.8 + Math.random() * 1.4,
      drift: Math.random() * 120 - 60,
      rotation: Math.random() * 80 - 40,
      emoji: ['🔥', '🧡', '❤️', '💛'][Math.floor(Math.random() * 4)],
    }));

    // ✨ 작은 잔불 입자 15~25개
    const newSparks = Array.from({ length: 15 + Math.floor(Math.random() * 10) }).map((_, i) => ({
      id: `spark-${Date.now()}-${i}`,
      left: 10 + Math.random() * 80,
      drift: Math.random() * 100 - 50,
      duration: 1 + Math.random(),
    }));

    setFlames((prev) => [...prev, ...newFlames]);
    setSparks((prev) => [...prev, ...newSparks]);

    const cleanup = setTimeout(() => {
      setFlames([]);
      setSparks([]);
    }, 2200);

    return () => clearTimeout(cleanup);
  }, [incomingCheer]);

  return (
      <div className="cheer-layer">
        {flames.map((f) => (
            <div
                key={f.id}
                className="cheer-flame"
                style={{
                  left: `${f.left}%`,
                  '--horizontal-drift': `${f.drift}px`,
                  '--rotation-end': `${f.rotation}deg`,
                  '--scale': f.scale,
                  '--duration': `${f.duration}s`,
                }}
            >
              {f.emoji}
            </div>
        ))}

        {sparks.map((s) => (
            <div
                key={s.id}
                className="cheer-spark"
                style={{
                  left: `${s.left}%`,
                  '--spark-drift': `${s.drift}px`,
                  '--spark-duration': `${s.duration}s`,
                }}
            />
        ))}
      </div>
  );
}