import { useEffect, useRef, useState } from 'react';
import { useStore } from '../data/store';
import './ServerError.css';

export default function ServerError() {
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

    // Flappy Bird variables
    let drone = { x: 100, y: canvas.height / 2, velocity: 0, radius: 12 };
    let gravity = 0.5;
    let jump = -8;
    let pipes = [];
    let pipeWidth = 60;
    let pipeGap = 150;
    let frameCount = 0;
    let currentScore = 0;
    let gameSpeed = 3;

    const handleJump = (e) => {
      e.preventDefault();
      drone.velocity = jump;
    };
    canvas.addEventListener('mousedown', handleJump);
    window.addEventListener('keydown', (e) => { if (e.code === 'Space') handleJump(e); });
    canvas.addEventListener('touchstart', handleJump, { passive: false });

    const render = () => {
      ctx.fillStyle = '#17110B'; // Very dark orange/brown
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(245, 158, 11, 0.05)';
      ctx.font = "bold 180px 'Inter', sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("500", canvas.width / 2, canvas.height / 2);

      frameCount++;

      // Physics
      drone.velocity += gravity;
      drone.y += drone.velocity;

      // Generate pipes
      if (frameCount % 100 === 0) {
        let topHeight = Math.random() * (canvas.height - pipeGap - 40) + 20;
        pipes.push({
          x: canvas.width,
          topHeight: topHeight,
          passed: false
        });
      }

      // Draw and update pipes
      for (let i = pipes.length - 1; i >= 0; i--) {
        let p = pipes[i];
        p.x -= gameSpeed;

        // Draw Server Racks (Pipes)
        const gradient = ctx.createLinearGradient(p.x, 0, p.x + pipeWidth, 0);
        gradient.addColorStop(0, '#f59e0b');
        gradient.addColorStop(1, '#b45309');
        ctx.fillStyle = gradient;
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 10;
        
        // Top pipe
        ctx.fillRect(p.x, 0, pipeWidth, p.topHeight);
        // Bottom pipe
        ctx.fillRect(p.x, p.topHeight + pipeGap, pipeWidth, canvas.height - p.topHeight - pipeGap);

        // Collision
        if (
          drone.x + drone.radius > p.x && 
          drone.x - drone.radius < p.x + pipeWidth && 
          (drone.y - drone.radius < p.topHeight || drone.y + drone.radius > p.topHeight + pipeGap)
        ) {
          // Reset
          currentScore = 0;
          setScore(0);
          pipes = [];
          drone.y = canvas.height / 2;
          drone.velocity = 0;
          ctx.fillStyle = 'rgba(245, 158, 11, 0.5)';
          ctx.fillRect(0, 0, canvas.width, canvas.height);
          break;
        }

        // Score tracking
        if (p.x + pipeWidth < drone.x && !p.passed) {
          p.passed = true;
          currentScore++;
          setScore(currentScore);
          setHighScore(prev => Math.max(prev, currentScore));
        }

        if (p.x + pipeWidth < 0) {
          pipes.splice(i, 1);
        }
      }

      // Floor/Ceiling collision
      if (drone.y > canvas.height || drone.y < 0) {
        currentScore = 0;
        setScore(0);
        pipes = [];
        drone.y = canvas.height / 2;
        drone.velocity = 0;
      }

      // Draw Drone
      ctx.fillStyle = '#10b981'; // Green status light
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 15;
      ctx.beginPath();
      ctx.arc(drone.x, drone.y, drone.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeCanvas);
      canvas.removeEventListener('mousedown', handleJump);
      canvas.removeEventListener('touchstart', handleJump);
    };
  }, []);

  return (
    <div className="error-page error-500 animate-in">
      <div className="error-header">
        <h1 className="error-title">500</h1>
        <p className="error-subtitle">Server Crash. Fly the drone to reboot the servers!</p>
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
        <canvas ref={canvasRef} className="error-canvas flappy" />
        <p className="error-hint">Click the canvas or press Spacebar to fly.</p>
      </div>

      <div className="error-actions">
        <button className="btn-glass-premium" onClick={() => setActivePage('dashboard')}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
