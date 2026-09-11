"use client";

import React, { useEffect, useRef } from 'react';

interface Droplet3D {
  x: number;
  y: number;
  z: number;
  radius: number;
  speed: number;
  pulseOffset: number;
  opacity: number;
  hue: number;
}

export const ThreeDWaterBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Mouse tracking for 3D perspective shift & interactive ripples
    let mouseX = width / 2;
    let mouseY = height / 2;
    let targetMouseX = width / 2;
    let targetMouseY = height / 2;
    let rippleStrength = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = e.clientX;
      targetMouseY = e.clientY;
      rippleStrength = Math.min(rippleStrength + 2.5, 45);
    };

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', handleResize);

    // 3D Floating Water Droplets
    const droplets: Droplet3D[] = [];
    const DROPLET_COUNT = 45;

    for (let i = 0; i < DROPLET_COUNT; i++) {
      droplets.push({
        x: (Math.random() - 0.5) * width * 1.5,
        y: (Math.random() - 0.5) * height * 1.5,
        z: Math.random() * 800 + 100,
        radius: Math.random() * 6 + 3,
        speed: Math.random() * 0.4 + 0.2,
        pulseOffset: Math.random() * Math.PI * 2,
        opacity: Math.random() * 0.4 + 0.35,
        hue: Math.random() > 0.4 ? 160 : 185, // Emerald to Teal/Cyan hues
      });
    }

    // 3D Terrain & Canal Grid Configuration
    const COLS = 26;
    const ROWS = 22;
    const CELL_SIZE = 55;
    let time = 0;

    const render = () => {
      time += 0.016;

      // Smooth mouse damping
      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;
      rippleStrength *= 0.96;

      ctx.clearRect(0, 0, width, height);

      // 1. Ambient Background Gradient (Lush agricultural atmosphere)
      const bgGradient = ctx.createRadialGradient(
        mouseX,
        mouseY * 0.8,
        50,
        width / 2,
        height / 2,
        Math.max(width, height)
      );
      bgGradient.addColorStop(0, 'rgba(236, 253, 245, 0.95)'); // Emerald 50
      bgGradient.addColorStop(0.4, 'rgba(240, 253, 250, 0.9)'); // Teal 50
      bgGradient.addColorStop(0.75, 'rgba(241, 245, 249, 0.95)'); // Slate 100
      bgGradient.addColorStop(1, 'rgba(226, 232, 240, 1)'); // Slate 200

      ctx.fillStyle = bgGradient;
      ctx.fillRect(0, 0, width, height);

      // 2. Camera perspective parameters
      const fov = 450;
      const cameraY = -height * 0.25;
      const cameraZ = -500;
      const pitch = 0.98 + (mouseY / height - 0.5) * 0.18; // tilt up/down
      const yaw = (mouseX / width - 0.5) * 0.25; // tilt left/right

      // 3D Point projection function
      const project = (x: number, y: number, z: number) => {
        // Rotate around Y axis (Yaw)
        const cosYaw = Math.cos(yaw);
        const sinYaw = Math.sin(yaw);
        const rx = x * cosYaw - z * sinYaw;
        const rz1 = x * sinYaw + z * cosYaw;

        // Rotate around X axis (Pitch)
        const cosPitch = Math.cos(pitch);
        const sinPitch = Math.sin(pitch);
        const ry = (y - cameraY) * cosPitch - (rz1 - cameraZ) * sinPitch;
        const rz2 = (y - cameraY) * sinPitch + (rz1 - cameraZ) * cosPitch;

        if (rz2 <= 10) return null; // Behind camera

        const scale = fov / rz2;
        return {
          px: width / 2 + rx * scale,
          py: height / 2 + ry * scale,
          scale,
          depth: rz2,
        };
      };

      // 3. Calculate 3D Grid vertices with harmonious fluid waves
      const gridXOffset = ((COLS - 1) * CELL_SIZE) / 2;
      const gridYOffset = ((ROWS - 1) * CELL_SIZE) / 2;

      const projectedPoints: Array<Array<{ px: number; py: number; scale: number; depth: number; elevation: number } | null>> = [];

      for (let r = 0; r < ROWS; r++) {
        projectedPoints[r] = [];
        for (let c = 0; c < COLS; c++) {
          const worldX = c * CELL_SIZE - gridXOffset;
          const worldY = r * CELL_SIZE - gridYOffset + 160;

          // Multi-octave 3D water ripple equation
          const mouseDist = Math.hypot(
            worldX - (mouseX - width / 2) * 1.5,
            worldY - (mouseY - height / 2) * 1.5
          );

          const wave1 = Math.sin(worldX * 0.015 + time * 1.4) * 22;
          const wave2 = Math.cos(worldY * 0.018 + time * 1.1) * 18;
          const wave3 = Math.sin((worldX + worldY) * 0.012 + time * 0.9) * 14;
          const mouseRipple = Math.sin(mouseDist * 0.04 - time * 4) * (rippleStrength * Math.exp(-mouseDist * 0.003));

          const elevation = wave1 + wave2 + wave3 + mouseRipple;
          const proj = project(worldX, worldY, elevation);

          if (proj) {
            projectedPoints[r][c] = { ...proj, elevation };
          } else {
            projectedPoints[r][c] = null;
          }
        }
      }

      // 4. Draw 3D Water Canal Mesh Surfaces & Flow Lines
      for (let r = 0; r < ROWS - 1; r++) {
        for (let c = 0; c < COLS - 1; c++) {
          const p1 = projectedPoints[r][c];
          const p2 = projectedPoints[r][c + 1];
          const p3 = projectedPoints[r + 1][c + 1];
          const p4 = projectedPoints[r + 1][c];

          if (!p1 || !p2 || !p3 || !p4) continue;

          // Color shading based on elevation and depth
          const avgElev = (p1.elevation + p2.elevation + p3.elevation + p4.elevation) / 4;
          const normalizedElev = Math.max(0, Math.min(1, (avgElev + 35) / 70));
          const depthAlpha = Math.max(0.08, Math.min(0.45, 1 - p1.depth / 1400));

          // Draw filled translucent water polygon
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.lineTo(p3.px, p3.py);
          ctx.lineTo(p4.px, p4.py);
          ctx.closePath();

          const rCol = Math.round(5 + normalizedElev * 20);
          const gCol = Math.round(130 + normalizedElev * 85);
          const bCol = Math.round(140 + normalizedElev * 70);
          ctx.fillStyle = `rgba(${rCol}, ${gCol}, ${bCol}, ${depthAlpha * 0.35})`;
          ctx.fill();

          // Draw shimmering canal grid line
          ctx.strokeStyle = `rgba(16, 185, 129, ${depthAlpha * 0.6})`;
          ctx.lineWidth = Math.max(0.7, p1.scale * 1.2);
          ctx.stroke();
        }
      }

      // 5. Draw Illuminated Canal Water Flow Nodes
      for (let r = 0; r < ROWS; r += 2) {
        for (let c = 0; c < COLS; c += 2) {
          const p = projectedPoints[r][c];
          if (!p) continue;

          const pulse = Math.sin(time * 3 + r + c) * 0.5 + 0.5;
          const nodeRadius = Math.max(1.2, p.scale * (2.8 + pulse * 1.5));

          ctx.beginPath();
          ctx.arc(p.px, p.py, nodeRadius, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(52, 211, 153, ${Math.max(0.2, 0.85 - p.depth / 1200)})`;
          ctx.fill();

          // Soft radiant bloom for prominent crests
          if (p.elevation > 12) {
            ctx.beginPath();
            ctx.arc(p.px, p.py, nodeRadius * 2.2, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(16, 185, 129, 0.15)`;
            ctx.fill();
          }
        }
      }

      // 6. Draw 3D Floating Water Droplets with Realistic Lighting & Refraction
      for (let i = 0; i < droplets.length; i++) {
        const drop = droplets[i];

        // Float motion in 3D
        drop.y -= drop.speed;
        drop.x += Math.sin(time + drop.pulseOffset) * 0.4;
        drop.z -= Math.cos(time * 0.5 + drop.pulseOffset) * 0.3;

        // Reset if floated off screen
        if (drop.y < -height * 0.8) {
          drop.y = height * 0.8;
          drop.x = (Math.random() - 0.5) * width * 1.4;
          drop.z = Math.random() * 800 + 100;
        }

        const proj = project(drop.x, drop.y, drop.z);
        if (!proj) continue;

        const radius = drop.radius * proj.scale * 1.6;
        if (radius <= 0.5) continue;

        // 3D Liquid Sphere Gradient with Specular Light Highlight
        const dropGrad = ctx.createRadialGradient(
          proj.px - radius * 0.35,
          proj.py - radius * 0.35,
          radius * 0.1,
          proj.px,
          proj.py,
          radius
        );
        dropGrad.addColorStop(0, `rgba(255, 255, 255, ${drop.opacity * 1.3})`);
        dropGrad.addColorStop(0.3, `hsla(${drop.hue}, 85%, 65%, ${drop.opacity * 0.9})`);
        dropGrad.addColorStop(0.8, `hsla(${drop.hue}, 90%, 45%, ${drop.opacity * 0.7})`);
        dropGrad.addColorStop(1, `hsla(${drop.hue}, 95%, 35%, 0.1)`);

        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius, 0, Math.PI * 2);
        ctx.fillStyle = dropGrad;
        ctx.fill();

        // 3D Specular Highlight glint
        ctx.beginPath();
        ctx.arc(proj.px - radius * 0.3, proj.py - radius * 0.35, radius * 0.25, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.fill();

        // Outer soft glow
        ctx.beginPath();
        ctx.arc(proj.px, proj.py, radius * 1.8, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${drop.hue}, 90%, 60%, 0.08)`;
        ctx.fill();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <canvas
        ref={canvasRef}
        className="w-full h-full block"
        style={{ filter: 'contrast(105%) brightness(102%)' }}
      />
      {/* 3D Vignette Overlay for Depth Isolation */}
      <div className="absolute inset-0 bg-radial-[ellipse_at_center,_var(--tw-gradient-stops)] from-transparent via-emerald-950/5 to-slate-900/15 pointer-events-none" />
    </div>
  );
};
