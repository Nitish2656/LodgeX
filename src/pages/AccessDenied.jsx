import { useEffect, useRef, useState } from 'react';
import { useStore } from '../data/store';
import './AccessDenied.css';

export default function AccessDenied() {
  const { setActivePage } = useStore();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resizeCanvas = () => {
      canvas.width = Math.min(800, window.innerWidth - 40);
      canvas.height = Math.min(500, window.innerHeight - 250);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    let playerRadius = 15;
    let playerX = canvas.width / 2;
    let playerY = canvas.height - playerRadius - 20;
    
    let enemies = [];
    let frameCount = 0;
    let currentScore = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const root = document.documentElement;
      playerX = (e.clientX - rect.left - root.scrollLeft);
      if (playerX < playerRadius) playerX = playerRadius;
      if (playerX > canvas.width - playerRadius) playerX = canvas.width - playerRadius;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    const handleTouchMove = (e) => {
      e.preventDefault(); // Prevent scrolling
      const rect = canvas.getBoundingClientRect();
      playerX = (e.touches[0].clientX - rect.left);
      if (playerX < playerRadius) playerX = playerRadius;
      if (playerX > canvas.width - playerRadius) playerX = canvas.width - playerRadius;
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const render = () => {
      ctx.fillStyle = '#110505'; // Very dark red/black
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(239, 68, 68, 0.05)';
      ctx.font = "bold 180px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("403", canvas.width / 2, canvas.height / 2);

      frameCount++;
      const speedMult = 1 + (currentScore * 0.03);

      if (frameCount % Math.max(10, Math.floor(40 / speedMult)) === 0) {
        enemies.push({
          x: Math.random() * canvas.width,
          y: -30,
          radius: 8 + Math.random() * 15,
          speed: (2 + Math.random() * 4) * speedMult
        });
      }

      for (let i = enemies.length - 1; i >= 0; i--) {
        let e = enemies[i];
        e.y += e.speed;

        // Circle collision
        const dx = playerX - e.x;
        const dy = playerY - e.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < playerRadius + e.radius - 2) { // slight leniency
          currentScore = 0;
          setScore(0);
          enemies = [];
          // Red flash effect
          ctx.fillStyle = 'rgba(239, 68, 68, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        }

        if (e.y - e.radius > canvas.height) {
          enemies.splice(i, 1);
          currentScore++;
          setScore(currentScore);
          setHighScore(prev => Math.max(prev, currentScore));
        } else {
          ctx.fillStyle = '#ef4444'; // Red lasers
          ctx.shadowColor = '#ef4444';
          ctx.shadowBlur = 15;
          ctx.beginPath();
          ctx.arc(e.x, e.y, e.radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw player shield
      ctx.fillStyle = '#3b82f6'; // Blue shield
      ctx.shadowColor = '#3b82f6';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(playerX, playerY, playerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="error-page error-403 animate-in">
      <div className="error-header">
        <h1 className="error-title">403</h1>
        <p className="error-subtitle">Access Denied. Dodge the security lasers!</p>
      </div>

      <div className="error-game-container">
        <div className="error-score-board">
          <div className="score-box">
            <span>Score</span>
            <h2>{score}</h2>
          </div>
          <div className="score-box">
            <span>Best</span>
            <h2>{highScore}</h2>
          </div>
        </div>
        <canvas ref={canvasRef} className="error-canvas" />
        <p className="error-hint">Move your mouse horizontally to control the blue shield.</p>
      </div>

      <div className="error-actions">
        <button className="btn-glass-premium" onClick={() => setActivePage('dashboard')}>
          Flee to Dashboard
        </button>
      </div>
    </div>
  );
}
