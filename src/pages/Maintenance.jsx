import { useEffect, useRef, useState } from 'react';
import { useStore } from '../data/store';
import './Maintenance.css';

export default function Maintenance() {
  const { setActivePage } = useStore();
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [lives, setLives] = useState(3);

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

    // Player (Toolbox)
    const playerWidth = 100;
    const playerHeight = 20;
    let playerX = canvas.width / 2 - playerWidth / 2;
    const playerY = canvas.height - playerHeight - 20;

    let items = [];
    let particles = [];
    let frameCount = 0;
    let currentScore = 0;
    let currentLives = 3;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const root = document.documentElement;
      const mouseX = e.clientX - rect.left - root.scrollLeft;
      playerX = mouseX - playerWidth / 2;
      
      if (playerX < 0) playerX = 0;
      if (playerX > canvas.width - playerWidth) playerX = canvas.width - playerWidth;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Touch control
    const handleTouchMove = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        playerX = touchX - playerWidth / 2;
        if (playerX < 0) playerX = 0;
        if (playerX > canvas.width - playerWidth) playerX = canvas.width - playerWidth;
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const createParticles = (x, y, color) => {
      for (let i = 0; i < 8; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 8,
          vy: (Math.random() - 0.5) * 8 - 2, // Shoot upwards slightly
          life: 1,
          color
        });
      }
    };

    const drawHexagon = (x, y, radius, rotation, color) => {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rotation);
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        ctx.lineTo(radius * Math.cos(i * Math.PI / 3), radius * Math.sin(i * Math.PI / 3));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
      // Inner hole
      ctx.beginPath();
      ctx.arc(0, 0, radius / 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0F172A';
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.restore();
    };

    const render = () => {
      // Background
      ctx.fillStyle = '#0F172A'; // Slate dark blue
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Blueprint Grid
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.05)';
      ctx.lineWidth = 1;
      for(let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
      }
      for(let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
      }

      ctx.fillStyle = 'rgba(56, 189, 248, 0.03)';
      ctx.font = "bold 180px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("503", canvas.width / 2, canvas.height / 2);

      frameCount++;
      const difficulty = 1 + (currentScore * 0.05);

      // Spawn items (Bolts)
      if (frameCount % Math.max(30, Math.floor(70 / difficulty)) === 0) {
        items.push({
          x: 20 + Math.random() * (canvas.width - 40),
          y: -20,
          radius: 12 + Math.random() * 8,
          speed: (2 + Math.random() * 3) * difficulty,
          rotation: Math.random() * Math.PI * 2,
          spinSpeed: (Math.random() - 0.5) * 0.2
        });
      }

      // Update and draw items
      for (let i = items.length - 1; i >= 0; i--) {
        let item = items[i];
        item.y += item.speed;
        item.rotation += item.spinSpeed;

        // Collision with player (Toolbox)
        if (
          item.y + item.radius > playerY &&
          item.y - item.radius < playerY + playerHeight &&
          item.x + item.radius > playerX &&
          item.x - item.radius < playerX + playerWidth
        ) {
          // Caught
          items.splice(i, 1);
          currentScore++;
          setScore(currentScore);
          setHighScore(prev => Math.max(prev, currentScore));
          createParticles(item.x, playerY, '#38bdf8');
          continue;
        }

        // Missed (Hit bottom)
        if (item.y > canvas.height + item.radius) {
          items.splice(i, 1);
          currentLives--;
          setLives(currentLives);
          
          // Screen flash red for damage
          ctx.fillStyle = 'rgba(239, 68, 68, 0.2)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (currentLives <= 0) {
            // Game Over
            currentScore = 0;
            currentLives = 3;
            items = [];
            setScore(0);
            setLives(3);
          }
          continue;
        }

        // Draw Bolt
        drawHexagon(item.x, item.y, item.radius, item.rotation, '#38bdf8');
      }

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.05;
        if (p.life <= 0) {
          particles.splice(i, 1);
        } else {
          ctx.fillStyle = p.color;
          ctx.globalAlpha = p.life;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3 * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      // Draw Player (Toolbox)
      const toolboxGradient = ctx.createLinearGradient(playerX, playerY, playerX, playerY + playerHeight);
      toolboxGradient.addColorStop(0, '#0ea5e9');
      toolboxGradient.addColorStop(1, '#0284c7');
      
      ctx.fillStyle = toolboxGradient;
      ctx.shadowColor = '#0ea5e9';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.roundRect(playerX, playerY, playerWidth, playerHeight, 4);
      ctx.fill();
      
      // Toolbox inner stripe
      ctx.fillStyle = '#0F172A';
      ctx.fillRect(playerX + 10, playerY + 5, playerWidth - 20, playerHeight - 10);
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
    <div className="error-page error-503 animate-in">
      <div className="error-header">
        <h1 className="error-title">503</h1>
        <p className="error-subtitle">Maintenance Mode. Catch the falling bolts!</p>
      </div>

      <div className="error-game-container">
        <div className="error-score-board single">
          <div className="score-box player">
            <span>Score</span>
            <h2>{score}</h2>
          </div>
          <div className="score-box ai" style={{color: 'var(--text-tertiary)'}}>
            <span>Best</span>
            <h2>{highScore}</h2>
          </div>
          <div className="score-box" style={{color: '#ef4444'}}>
            <span>Lives</span>
            <h2>{lives}</h2>
          </div>
        </div>
        <canvas ref={canvasRef} className="error-canvas vertical" title="Move your mouse horizontally to catch the bolts" />
        <p className="error-hint">Move your mouse left and right to control the toolbox.</p>
      </div>

      <div className="error-actions">
        <button className="btn-glass-premium" onClick={() => setActivePage('dashboard')}>
          Go to Dashboard
        </button>
      </div>
    </div>
  );
}
