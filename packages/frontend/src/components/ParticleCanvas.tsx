import { useEffect, useRef } from 'react';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  radius: number;
  baseAlpha: number;
  color: [number, number, number];
}

interface Ripple {
  x: number; y: number;
  r: number; maxR: number; alpha: number;
}

// weighted pool: indigo/violet/blue majority, cyan as a sparse accent (~1-in-8)
const COLORS: [number, number, number][] = [
  [99,  102, 241],
  [139, 92,  246],
  [59,  130, 246],
  [167, 139, 250],
  [99,  102, 241],
  [139, 92,  246],
  [59,  130, 246],
  [34,  211, 238],
];

const REPEL_R2      = 130 * 130;   // squared — avoids sqrt in repulsion check
const CONNECT_R2    = 100 * 100;   // squared — avoids sqrt in connection check
const CONNECT_R     = 100;         // real value used only when drawing
const MAX_SPEED     = 0.5;
const RIPPLE_MAX_R  = 180;
const RIPPLE_EXPAND = 3.5;

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

function initParticles(count: number, w: number, h: number): Particle[] {
  return Array.from({ length: count }, () => ({
    x:         rand(0, w),
    y:         rand(0, h),
    vx:        rand(-0.3, 0.3),
    vy:        rand(-0.3, 0.3),
    radius:    rand(1.5, 3),
    baseAlpha: rand(0.35, 0.8),
    color:     COLORS[Math.floor(Math.random() * COLORS.length)],
  }));
}

export default function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const canvasEl = canvas;

    let animId = 0;
    let W = 0, H = 0;
    let particles: Particle[] = [];
    const ripples: Ripple[]   = [];
    const mouse = { x: -9999, y: -9999 };

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvasEl.width  = W;
      canvasEl.height = H;
      particles = initParticles(W < 640 ? 35 : 60, W, H);
    }

    // passive — only store; all physics in rAF
    function onMouseMove(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }

    function onClick(e: MouseEvent) {
      ripples.push({ x: e.clientX, y: e.clientY, r: 0, maxR: RIPPLE_MAX_R, alpha: 0.65 });
    }

    function tick() {
      ctx.clearRect(0, 0, W, H);

      const mx = mouse.x;
      const my = mouse.y;

      // ── connections: one batched path, squared distance rejection ──
      ctx.beginPath();
      ctx.lineWidth = 0.7;

      for (let i = 0; i < particles.length; i++) {
        const a = particles[i];
        for (let j = i + 1; j < particles.length; j++) {
          const b  = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < CONNECT_R2) {
            // only sqrt when we're actually drawing
            const alpha = (1 - Math.sqrt(d2) / CONNECT_R) * 0.2;
            ctx.globalAlpha = alpha;
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
          }
        }
      }
      ctx.strokeStyle = 'rgb(99,102,241)';
      ctx.stroke();
      ctx.globalAlpha = 1;

      // ── particles ──
      for (const p of particles) {
        const dx = p.x - mx;
        const dy = p.y - my;
        const d2 = dx * dx + dy * dy;

        if (d2 < REPEL_R2 && d2 > 0) {
          const d     = Math.sqrt(d2);
          const force = ((Math.sqrt(REPEL_R2) - d) / Math.sqrt(REPEL_R2)) * 0.22;
          p.vx += (dx / d) * force;
          p.vy += (dy / d) * force;
        }

        p.vx *= 0.985;
        p.vy *= 0.985;
        const spd = p.vx * p.vx + p.vy * p.vy;
        if (spd > MAX_SPEED * MAX_SPEED) {
          const inv = MAX_SPEED / Math.sqrt(spd);
          p.vx *= inv;
          p.vy *= inv;
        }

        p.x += p.vx;
        p.y += p.vy;

        if (p.x < p.radius)     { p.x = p.radius;      p.vx *= -1; }
        if (p.x > W - p.radius) { p.x = W - p.radius;  p.vx *= -1; }
        if (p.y < p.radius)     { p.y = p.radius;       p.vy *= -1; }
        if (p.y > H - p.radius) { p.y = H - p.radius;  p.vy *= -1; }

        const proximity = d2 < REPEL_R2 ? (1 - Math.sqrt(d2) / Math.sqrt(REPEL_R2)) * 0.45 : 0;
        const [r, g, b] = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius + proximity * 1.2, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.min(1, p.baseAlpha + proximity)})`;
        ctx.fill();
      }

      // ── ripples ──
      for (let i = ripples.length - 1; i >= 0; i--) {
        const rp = ripples[i];
        rp.r     += RIPPLE_EXPAND;
        rp.alpha -= 0.013;
        if (rp.alpha <= 0 || rp.r > rp.maxR) { ripples.splice(i, 1); continue; }

        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(99,102,241,${rp.alpha})`;
        ctx.lineWidth   = 2;
        ctx.stroke();

        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rp.r * 0.62, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(139,92,246,${rp.alpha * 0.45})`;
        ctx.lineWidth   = 1;
        ctx.stroke();
      }

      animId = requestAnimationFrame(tick);
    }

    resize();
    window.addEventListener('resize',    resize,      { passive: true });
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('click',     onClick);
    animId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize',    resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click',     onClick);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
    />
  );
}
