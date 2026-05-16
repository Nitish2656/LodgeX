import { useEffect, useRef, useState } from 'react';
import { useStore } from '../data/store';
import './NotFound.css';

export default function NotFound() {
  const { setActivePage } = useStore();
  const canvasRef = useRef(null);
  const [playerScore, setPlayerScore] = useState(0);
  const [highScore, setHighScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    // Set canvas dimensions
    const resizeCanvas = () => {
      canvas.width = Math.min(800, window.innerWidth - 40);
      canvas.height = Math.min(500, window.innerHeight - 250);
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Game entities
    const paddleWidth = 100;
    const paddleHeight = 14;
    const ballSize = 9;
    
    let playerX = canvas.width / 2 - paddleWidth / 2;
    let ballX = canvas.width / 2;
    let ballY = 50;
    let ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
    let ballSpeedY = 0;
    
    // Dynamic difficulty variables
    let currentGravity = 0.25;
    let currentBounce = 12;
    let scoreCount = 0;

    const trail = [];
    let particles = [];

    // Mouse control
    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const root = document.documentElement;
      const mouseX = e.clientX - rect.left - root.scrollLeft;
      playerX = mouseX - paddleWidth / 2;
      
      // Boundaries
      if (playerX < 0) playerX = 0;
      if (playerX > canvas.width - paddleWidth) playerX = canvas.width - paddleWidth;
    };
    canvas.addEventListener('mousemove', handleMouseMove);

    // Touch control for mobile
    const handleTouchMove = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const touchX = e.touches[0].clientX - rect.left;
        playerX = touchX - paddleWidth / 2;
        if (playerX < 0) playerX = 0;
        if (playerX > canvas.width - paddleWidth) playerX = canvas.width - paddleWidth;
    };
    canvas.addEventListener('touchmove', handleTouchMove, { passive: false });

    const resetBall = () => {
      ballX = canvas.width / 2;
      ballY = 50;
      ballSpeedX = (Math.random() > 0.5 ? 1 : -1) * 4;
      ballSpeedY = 0;
      currentGravity = 0.25;
      currentBounce = 12;
      scoreCount = 0;
      trail.length = 0; // Clear trail
    };

    const createParticles = (x, y, color) => {
      for (let i = 0; i < 12; i++) {
        particles.push({
          x, y,
          vx: (Math.random() - 0.5) * 10,
          vy: (Math.random() - 0.5) * 10,
          life: 1,
          color
        });
      }
    };

    const render = () => {
      // Clear canvas with dark theme background (slight trail fade effect)
      ctx.fillStyle = 'rgba(30, 31, 46, 0.4)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw "4 0 4" visual hint in background (faintly)
      ctx.fillStyle = 'rgba(255,255,255,0.02)';
      ctx.font = "bold 180px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("404", canvas.width / 2, canvas.height / 2);

      // Physics Update using dynamic gravity
      ballSpeedY += currentGravity;
      ballX += ballSpeedX;
      ballY += ballSpeedY;

      // Track trail
      trail.push({x: ballX, y: ballY});
      if (trail.length > 15) trail.shift();

      // Bounce off walls (left/right) with energy loss
      if (ballX < ballSize) {
        ballX = ballSize;
        ballSpeedX *= -0.8;
        createParticles(ballX, ballY, '#ffffff');
      } else if (ballX > canvas.width - ballSize) {
        ballX = canvas.width - ballSize;
        ballSpeedX *= -0.8;
        createParticles(ballX, ballY, '#ffffff');
      }
      
      // Bounce off ceiling
      if (ballY < ballSize) {
        ballY = ballSize;
        ballSpeedY *= -0.8;
        createParticles(ballX, ballY, '#ffffff');
      }

      // Check paddle collision
      const paddleY = canvas.height - 40;
      // Only bounce if falling down
      if (ballSpeedY > 0 && ballY + ballSize >= paddleY && ballY - ballSize < paddleY + paddleHeight) {
        if (ballX > playerX - ballSize && ballX < playerX + paddleWidth + ballSize) {
          
          scoreCount++;
          
          // Increase difficulty: ball falls faster and bounces harder
          currentGravity = 0.25 + (scoreCount * 0.02);
          currentBounce = 12 + (scoreCount * 0.35);

          ballY = paddleY - ballSize; // Push ball above paddle
          ballSpeedY = -currentBounce; // Bounce up
          
          // Realistic spin based on hit location
          const hitPos = (ballX - (playerX + paddleWidth / 2)) / (paddleWidth / 2);
          ballSpeedX += hitPos * (5 + scoreCount * 0.15); 
          
          // Cap horizontal speed dynamically based on score
          const maxSpeedX = 10 + (scoreCount * 0.4);
          if (ballSpeedX > maxSpeedX) ballSpeedX = maxSpeedX;
          if (ballSpeedX < -maxSpeedX) ballSpeedX = -maxSpeedX;
          
          createParticles(ballX, paddleY, '#34d399');
          
          setPlayerScore(scoreCount);
          setHighScore(hs => Math.max(hs, scoreCount));
        }
      }

      // Missed paddle (bottom) - Game Over
      if (ballY > canvas.height + ballSize * 2) {
        setPlayerScore(0);
        resetBall();
      }

      // Render Trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
        ctx.lineWidth = ballSize * 1.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }

      // Render Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        let p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
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

      // Draw Paddle (Realistic 3D Gradient)
      const paddleGradient = ctx.createLinearGradient(playerX, paddleY, playerX, paddleY + paddleHeight);
      paddleGradient.addColorStop(0, '#6ee7b7'); // Light top
      paddleGradient.addColorStop(0.5, '#10b981'); // Core color
      paddleGradient.addColorStop(1, '#047857'); // Dark bottom
      
      ctx.fillStyle = paddleGradient;
      ctx.shadowColor = 'rgba(16, 185, 129, 0.6)';
      ctx.shadowBlur = 15;
      ctx.shadowOffsetY = 5;
      ctx.beginPath();
      ctx.roundRect(playerX, paddleY, paddleWidth, paddleHeight, 8);
      ctx.fill();

      // Reset shadow for ball
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Draw Ball (Realistic 3D Radial Gradient)
      const ballGradient = ctx.createRadialGradient(ballX - ballSize/3, ballY - ballSize/3, 1, ballX, ballY, ballSize);
      ballGradient.addColorStop(0, '#ffffff'); // Bright highlight
      ballGradient.addColorStop(1, '#9ca3af'); // Shadowed edge
      
      ctx.fillStyle = ballGradient;
      ctx.shadowColor = '#ffffff';
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(ballX, ballY, ballSize, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
    };
  }, []);

  return (
    <div className="notfound-page animate-in">
      <div className="notfound-header">
        <h1 className="notfound-title-game">404</h1>
        <p className="notfound-subtitle-game">Looks like you're lost. Keep the ball bouncing!</p>
      </div>

      <div className="notfound-game-container vertical-mode">
        <div className="notfound-score-board single-player">
          <div className="score-box player">
            <span>Score</span>
            <h2>{playerScore}</h2>
          </div>
          <div className="score-box ai" style={{color: 'var(--text-tertiary)'}}>
            <span>Best</span>
            <h2>{highScore}</h2>
          </div>
        </div>
        <canvas 
          ref={canvasRef} 
          className="notfound-canvas vertical"
          title="Move your mouse horizontally to control the paddle"
        />
        <p className="notfound-hint">Move your mouse left and right to control the paddle.</p>
      </div>

      <div className="notfound-actions">
        <button className="btn-glass-premium" onClick={() => setActivePage('dashboard')}>
          Back to Dashboard
        </button>
      </div>
    </div>
  );
}
