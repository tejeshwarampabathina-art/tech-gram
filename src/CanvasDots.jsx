import React, { useEffect, useRef } from 'react';

const CanvasDots = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    let width, height;
    let dots = [];
    const spacing = 35; // The space between dots
    const radius = 1.5; // Dot radius
    const mouse = { x: -1000, y: -1000, isDown: false };
    
    let animationFrameId;

    const init = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      
      dots = [];
      const cols = Math.floor(width / spacing);
      const rows = Math.floor(height / spacing);
      
      const offsetX = (width - cols * spacing) / 2;
      const offsetY = (height - rows * spacing) / 2;

      for (let i = 0; i <= cols; i++) {
        for (let j = 0; j <= rows; j++) {
          dots.push({
            origX: offsetX + i * spacing,
            origY: offsetY + j * spacing,
            x: offsetX + i * spacing,
            y: offsetY + j * spacing,
            vx: 0,
            vy: 0
          });
        }
      }
    };

    const handlePointerMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    
    const handlePointerOut = () => {
      mouse.x = -1000;
      mouse.y = -1000;
      mouse.isDown = false;
    };

    const handlePointerDown = () => {
      mouse.isDown = true;
    };

    const handlePointerUp = () => {
      mouse.isDown = false;
    };

    window.addEventListener('resize', init);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointerout', handlePointerOut);

    init();

    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#2A3439'; // The charcoal black color requested

      // Waves: increase interaction dramatically on touch/click
      const interactionRadius = mouse.isDown ? 280 : 130;
      const forceMultiplier = mouse.isDown ? 15 : 4;
      const spring = 0.05; // Elastic spring effect
      const friction = 0.85; // Viscous friction

      ctx.beginPath();
      dots.forEach(dot => {
        // Compute distance from mouse
        const dx = mouse.x - dot.x;
        const dy = mouse.y - dot.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (dist < interactionRadius) {
          // Antigravity logic: repel away
          const force = (interactionRadius - dist) / interactionRadius;
          const pushX = (dx / dist) * force * -forceMultiplier;
          const pushY = (dy / dist) * force * -forceMultiplier;
          
          dot.vx += pushX;
          dot.vy += pushY;
        }

        // Hooke's Law: Spring back to absolute original position
        dot.vx += (dot.origX - dot.x) * spring;
        dot.vy += (dot.origY - dot.y) * spring;

        // Apply friction
        dot.vx *= friction;
        dot.vy *= friction;

        // Update position
        dot.x += dot.vx;
        dot.y += dot.vy;

        // Optimized drawing (batch paths)
        ctx.moveTo(dot.x, dot.y);
        ctx.arc(dot.x, dot.y, radius, 0, Math.PI * 2);
      });
      ctx.fill();

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', init);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointerout', handlePointerOut);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas 
      ref={canvasRef} 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        zIndex: -1, // Ensures the canvas plays strictly in the background layer
        pointerEvents: 'none' // Allows clicking elements through the canvas
      }}
    />
  );
};

export default CanvasDots;
