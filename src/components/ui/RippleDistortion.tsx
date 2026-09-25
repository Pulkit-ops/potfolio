"use client";

import React, { useEffect, useRef } from "react";
import type { CSSProperties } from "react";
import { Renderer, Program, Mesh, Geometry, Triangle, Texture, RenderTarget } from "ogl";

const MAX_WAVES = 70;
const QUALITY_SCALE: Record<string, number> = { low: 0.4, medium: 0.6, high: 0.75 };
const START_SCALE = 1.0;
const LIFE_CONSTANT = Math.log(500);
const PLATE_W = 1448;
const PLATE_H = 1086;
/** Upper bound for the rasterised plate (2× the SVG's intrinsic size). */
const MAX_RASTER_SCALE = 2;

const waveVertex = `
precision highp float;

attribute vec2 position;
attribute vec2 uv;
attribute vec2 iOffset;
attribute vec2 iScale;
attribute float iOpacity;
attribute float iRings;

varying vec2 vUv;
varying float vOpacity;
varying float vRings;

void main() {
  vUv = uv;
  vOpacity = iOpacity;
  vRings = iRings;
  gl_Position = vec4(iOffset + position * iScale, 0.0, 1.0);
}
`;

const waveFragment = `
precision highp float;

varying vec2 vUv;
varying float vOpacity;
varying float vRings;

const float PI = 3.141592653589793;
const float EDGE = 0.006737947;

void main() {
  vec2 p = vUv * 2.0 - 1.0;
  float r = dot(p, p);
  if (r > 1.0) discard;

  // Continuous fluid Gaussian brush profile
  float brush = (exp(-r * 4.2) - EDGE) / (1.0 - EDGE);

  // Concentric ripple rings (active on click or textured hover)
  if (vRings > 0.05) {
    brush *= 0.48 + 0.52 * cos(sqrt(r) * PI * 2.0 * vRings);
  }

  gl_FragColor = vec4(vec3(brush * vOpacity * vOpacity), 1.0);
}
`;

const screenVertex = `
precision highp float;
attribute vec2 position;
attribute vec2 uv;
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

// The text-silhouette clip used to be a CSS mask-image on the canvas wrapper,
// which forced the browser to re-apply a full-viewport SVG mask every frame
// (and Safari to fall back to slow paths). The mask is now the undisplaced
// plate alpha sampled in-shader; it also lets ~70% of fragments exit early.
const compositeFragment = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform sampler2D uDisplacement;
uniform vec2 uResolution;
uniform vec2 uTextureSize;
uniform vec2 uTexel;
uniform vec3 uTint;
uniform vec3 uHighlight;
uniform float uStrength;
uniform float uSwirl;
uniform float uDispersion;
uniform float uGlint;
uniform float uTintAmount;

const float TAU = 6.283185307179586;

vec2 coverUV(vec2 uv) {
  vec2 safe = max(uTextureSize, vec2(1.0));
  vec2 s = uResolution / safe;
  vec2 scaledSize = safe * max(s.x, s.y);
  // Horizontally centered, vertically top-aligned (object-position: center top)
  vec2 offset = vec2((uResolution.x - scaledSize.x) * 0.5, uResolution.y - scaledSize.y);
  return (uv * uResolution - offset) / scaledSize;
}

void main() {
  vec2 base = coverUV(vUv);
  float mask = texture2D(uTexture, base).a;
  if (mask < 0.004) discard;

  float amount = texture2D(uDisplacement, vUv).r;
  float theta = amount * uSwirl * TAU;
  vec2 push = vec2(sin(theta), cos(theta)) * amount * uStrength;

  vec4 tex = texture2D(uTexture, base + push);
  if (tex.a < 0.04) discard;

  // Fluid liquid metal / molten ruby surface gradient
  vec3 topTone = vec3(1.0, 0.24, 0.26);
  vec3 midTone = vec3(0.90, 0.11, 0.14);
  vec3 deepTone = vec3(0.68, 0.05, 0.08);
  float liquidY = clamp((base.y + push.y * 3.5 - 0.38) * 1.8, 0.0, 1.0);
  vec3 liquidGrad = mix(deepTone, mix(midTone, topTone, liquidY), liquidY);
  vec3 color = mix(tex.rgb, liquidGrad, 0.60);

  // Everything below only changes pixels that are actually displaced.
  if (amount > 0.001) {
    if (uDispersion > 0.001) {
      float split = uDispersion * 0.25;
      vec3 disp;
      disp.r = texture2D(uTexture, base + push * (1.0 + split)).r;
      disp.g = tex.g;
      disp.b = texture2D(uTexture, base + push * (1.0 - split)).b;
      color = mix(disp, color, 0.65);
    }

    if (uTintAmount > 0.001) {
      color = mix(color, color * uTint * 1.5, clamp(amount * 1.5, 0.0, 1.0) * uTintAmount);
    }

    float ex = texture2D(uDisplacement, vUv + vec2(uTexel.x, 0.0)).r - texture2D(uDisplacement, vUv - vec2(uTexel.x, 0.0)).r;
    float ey = texture2D(uDisplacement, vUv + vec2(0.0, uTexel.y)).r - texture2D(uDisplacement, vUv - vec2(0.0, uTexel.y)).r;

    vec3 normal = normalize(vec3(-ex * 85.0, -ey * 85.0, 1.0));
    vec3 light = normalize(vec3(-0.35, 0.55, 0.85));
    vec3 halfVec = normalize(light + vec3(0.0, 0.0, 1.0));

    // Specular glint on wave crests
    float spec = pow(max(dot(normal, halfVec), 0.0), 18.0);
    color += uHighlight * spec * uGlint * clamp(amount * 4.0, 0.0, 1.0);

    // Slope shading: lit crests, deeper ruby troughs
    float waveSlope = dot(normal.xy, light.xy);
    float slopeMix = clamp(amount * 2.8, 0.0, 1.0);
    color += uHighlight * clamp(waveSlope * 1.4, 0.0, 0.75) * slopeMix;
    color = mix(color, color * 0.55, clamp(-waveSlope * 1.4, 0.0, 0.6) * slopeMix);
  }

  gl_FragColor = vec4(color, tex.a * mask);
}
`;

type RippleTrigger = "hover" | "click" | "both";
type RippleQuality = "low" | "medium" | "high";

export interface RipplePlateSource {
  /** Media query that selects this plate; omit for the fallback. */
  media?: string;
  src: string;
}

export interface RippleDistortionProps {
  /** Ordered plate candidates; the first whose media query matches is used. */
  sources: RipplePlateSource[];
  /** Element whose pointer events drive the ripple (defaults to window). */
  interactionTarget?: React.RefObject<HTMLElement | null>;
  brushSize?: number;
  strength?: number;
  swirl?: number;
  rings?: number;
  hoverRings?: number;
  spread?: number;
  fade?: number;
  speed?: number;
  spacing?: number;
  dispersion?: number;
  glint?: number;
  tint?: string;
  tintAmount?: number;
  highlightColor?: string;
  trigger?: RippleTrigger;
  clickStrength?: number;
  quality?: RippleQuality;
  /** Canvas pixel ratio cap. */
  dpr?: number;
  /** Fired once the first composited frame (with the plate) is on screen. */
  onReady?: () => void;
  /** Fired if WebGL is unavailable or the context is lost. */
  onFailure?: () => void;
  className?: string;
  style?: CSSProperties;
}

interface Wave {
  x: number;
  y: number;
  scale: number;
  target: number;
  size: number;
  opacity: number;
  rings: number;
}

const hexToRGB = (hex: string): [number, number, number] => {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return [1, 1, 1];
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
};

const pickSource = (sources: RipplePlateSource[]) =>
  (sources.find((s) => !s.media || window.matchMedia(s.media).matches) ?? sources[sources.length - 1]).src;

const RippleDistortion = ({
  sources,
  interactionTarget,
  brushSize = 90,
  strength = 0.16,
  swirl = 0.35,
  rings = 2,
  hoverRings = 0.0,
  spread = 2.6,
  fade = 3.2,
  speed = 0.55,
  spacing = 5,
  dispersion = 0.02,
  glint = 0.8,
  tint = "#e51d24",
  tintAmount = 0.18,
  highlightColor = "#ffffff",
  trigger = "both",
  clickStrength = 2.2,
  quality = "high",
  dpr = 1,
  onReady,
  onFailure,
  className = "",
  style,
}: RippleDistortionProps) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // Everything the effect needs, read through a ref so prop identity changes
  // never tear down the GL context. The effect runs once per mount.
  const propsRef = useRef({
    sources, brushSize, strength, swirl, rings, hoverRings, spread, fade, speed, spacing,
    dispersion, glint, tint, tintAmount, highlightColor, trigger, clickStrength, quality, dpr,
    onReady, onFailure, interactionTarget,
  });
  propsRef.current = {
    sources, brushSize, strength, swirl, rings, hoverRings, spread, fade, speed, spacing,
    dispersion, glint, tint, tintAmount, highlightColor, trigger, clickStrength, quality, dpr,
    onReady, onFailure, interactionTarget,
  };

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;
    const cfg = () => propsRef.current;
    const initial = cfg();

    let renderer: Renderer;
    try {
      renderer = new Renderer({
        alpha: true,
        // Fullscreen quad: MSAA buys nothing but costs a multisampled buffer.
        antialias: false,
        dpr: initial.dpr,
        powerPreference: "low-power",
        // Let the compositor skip preserving the buffer between frames.
        preserveDrawingBuffer: false,
      });
    } catch {
      initial.onFailure?.();
      return;
    }
    const gl = renderer.gl;
    if (!gl) {
      initial.onFailure?.();
      return;
    }
    gl.clearColor(0, 0, 0, 0);

    const canvas = gl.canvas as HTMLCanvasElement;
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    mount.appendChild(canvas);

    let disposed = false;
    let contextLost = false;

    const plateTexture = new Texture(gl, {
      generateMipmaps: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });

    const offsets = new Float32Array(MAX_WAVES * 2);
    const scales = new Float32Array(MAX_WAVES * 2);
    const opacities = new Float32Array(MAX_WAVES);
    const ringsArray = new Float32Array(MAX_WAVES);
    const waves: Wave[] = Array.from({ length: MAX_WAVES }, () => ({
      x: 0, y: 0, scale: START_SCALE, target: START_SCALE, size: 1, opacity: 0, rings: 0,
    }));
    let current = 0;

    const geometry = new Geometry(gl, {
      position: { size: 2, data: new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]) },
      uv: { size: 2, data: new Float32Array([0, 0, 1, 0, 0, 1, 0, 1, 1, 0, 1, 1]) },
      iOffset: { instanced: 1, size: 2, data: offsets },
      iScale: { instanced: 1, size: 2, data: scales },
      iOpacity: { instanced: 1, size: 1, data: opacities },
      iRings: { instanced: 1, size: 1, data: ringsArray },
    });

    const waveProgram = new Program(gl, {
      vertex: waveVertex,
      fragment: waveFragment,
      transparent: true,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
    });
    waveProgram.setBlendFunc(gl.ONE, gl.ONE);
    const waveMesh = new Mesh(gl, { geometry, program: waveProgram, frustumCulled: false });

    const displacementTarget = new RenderTarget(gl, {
      width: 2,
      height: 2,
      depth: false,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });

    const uniforms = {
      uTexture: { value: plateTexture },
      uDisplacement: { value: displacementTarget.texture },
      uResolution: { value: [1, 1] },
      uTextureSize: { value: [PLATE_W, PLATE_H] },
      uTexel: { value: [1, 1] },
      uTint: { value: hexToRGB(initial.tint) },
      uHighlight: { value: hexToRGB(initial.highlightColor) },
      uStrength: { value: initial.strength },
      uSwirl: { value: initial.swirl },
      uDispersion: { value: initial.dispersion },
      uGlint: { value: initial.glint },
      uTintAmount: { value: initial.tintAmount },
    };

    const compositeProgram = new Program(gl, {
      vertex: screenVertex,
      fragment: compositeFragment,
      uniforms,
      // Opaque pass into a cleared buffer: straight alpha is written as-is.
      depthTest: false,
      depthWrite: false,
    });
    const compositeGeometry = new Triangle(gl);
    const compositeMesh = new Mesh(gl, { geometry: compositeGeometry, program: compositeProgram });

    let width = 1;
    let height = 1;
    let plateReady = false;
    let readyFired = false;

    const renderComposite = () => {
      if (!plateReady || contextLost) return;
      renderer.render({ scene: compositeMesh });
      if (!readyFired) {
        readyFired = true;
        cfg().onReady?.();
      }
    };

    // ---- Plate loading: rasterise the SVG at the resolution it is displayed
    // at, so text edges stay crisp without a CSS mask. Re-rasterises only when
    // the plate changes or the required scale grows noticeably.
    let plateSrc = "";
    let plateImage: HTMLImageElement | null = null;
    let rasterScale = 0;
    const rasterCanvas = document.createElement("canvas");

    const neededScale = () => {
      const cover = Math.max((width * renderer.dpr) / PLATE_W, (height * renderer.dpr) / PLATE_H);
      return Math.min(MAX_RASTER_SCALE, Math.max(1, Math.ceil(cover * 4) / 4));
    };

    const rasterise = () => {
      if (!plateImage || disposed) return;
      const s = neededScale();
      if (plateReady && s <= rasterScale) return;
      rasterScale = s;
      const w = Math.round(PLATE_W * s);
      const h = Math.round(PLATE_H * s);
      rasterCanvas.width = w;
      rasterCanvas.height = h;
      const ctx = rasterCanvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      ctx.drawImage(plateImage, 0, 0, w, h);
      plateTexture.image = rasterCanvas;
      plateTexture.needsUpdate = true;
      plateReady = true;
      renderComposite();
    };

    const loadPlate = (src: string) => {
      if (src === plateSrc) return;
      plateSrc = src;
      const img = new window.Image();
      img.decoding = "async";
      img.onload = () => {
        if (disposed || plateSrc !== src) return;
        plateImage = img;
        rasterScale = 0;
        plateReady = false;
        rasterise();
      };
      img.onerror = () => {
        if (!disposed) cfg().onFailure?.();
      };
      img.src = src;
    };

    // ---- Layout cache: avoids getBoundingClientRect() on every pointer event.
    let docLeft = 0;
    let docTop = 0;
    const measure = () => {
      width = Math.max(1, mount.clientWidth);
      height = Math.max(1, mount.clientHeight);
      const r = mount.getBoundingClientRect();
      docLeft = r.left + window.scrollX;
      docTop = r.top + window.scrollY;
    };

    const resize = () => {
      measure();
      renderer.setSize(width, height);
      uniforms.uResolution.value = [width, height];
      const scale = QUALITY_SCALE[cfg().quality] || QUALITY_SCALE.high;
      const fieldW = Math.max(2, Math.round(width * scale));
      const fieldH = Math.max(2, Math.round(height * scale));
      displacementTarget.setSize(fieldW, fieldH);
      uniforms.uTexel.value = [1 / fieldW, 1 / fieldH];
      rasterise();
      renderComposite();
    };

    let lastW = 0;
    let lastH = 0;
    const ro = new ResizeObserver(() => {
      // Only reallocate GL buffers on real size changes.
      if (mount.clientWidth === lastW && mount.clientHeight === lastH) {
        measure();
        return;
      }
      lastW = mount.clientWidth;
      lastH = mount.clientHeight;
      resize();
    });
    ro.observe(mount);

    // Swap plates on breakpoint changes without recreating the context.
    const mediaLists = initial.sources
      .filter((s) => s.media)
      .map((s) => window.matchMedia(s.media as string));
    const onMediaChange = () => loadPlate(pickSource(cfg().sources));
    mediaLists.forEach((mq) => mq.addEventListener("change", onMediaChange));
    loadPlate(pickSource(initial.sources));

    // ---- Wave simulation
    let isLoopRunning = false;
    let isVisible = true;
    let needsRenderAfterClear = false;
    let raf = 0;
    let previousTime = 0;

    const startLoop = () => {
      if (!isLoopRunning && isVisible && !disposed && !contextLost) {
        isLoopRunning = true;
        previousTime = performance.now();
        raf = requestAnimationFrame(loop);
      }
    };

    const stopLoop = () => {
      if (isLoopRunning) {
        cancelAnimationFrame(raf);
        isLoopRunning = false;
      }
    };

    const setNewWave = (x: number, y: number, opacity = 1, ringCount = 0, scaleMult = 1.0, spreadMult = 1.0) => {
      const c = cfg();
      const wave = waves[current];
      current = (current + 1) % MAX_WAVES;
      wave.x = x;
      wave.y = y;
      wave.scale = START_SCALE * scaleMult;
      wave.target = START_SCALE * Math.max(1, c.spread) * scaleMult * spreadMult;
      wave.size = Math.max(1, c.brushSize);
      wave.opacity = opacity;
      wave.rings = ringCount;
      needsRenderAfterClear = true;
      startLoop();
    };

    const localPoint = (clientX: number, clientY: number): [number, number] | null => {
      const x = clientX + window.scrollX - docLeft;
      const y = clientY + window.scrollY - docTop;
      if (x < 0 || y < 0 || x > width || y > height) return null;

      // Restrict to the lettering region of the plate (texture space).
      const scale = Math.max(width / PLATE_W, height / PLATE_H);
      const offsetX = (width - PLATE_W * scale) * 0.5;
      const imgX = (x - offsetX) / scale;
      const imgY = y / scale;
      if (imgX < 110 || imgX > 1330 || imgY < 15 || imgY > 720) return null;

      return [x, height - y];
    };

    let lastX = 0;
    let lastY = 0;
    let hasLastPoint = false;

    const emitHoverStroke = (startX: number, startY: number, endX: number, endY: number) => {
      const c = cfg();
      const dx = endX - startX;
      const dy = endY - startY;
      const dist = Math.hypot(dx, dy);
      const stepSize = Math.max(3, c.spacing || 5);
      const steps = Math.min(Math.max(1, Math.floor(dist / stepSize)), 24);
      const strokeOpacity = Math.min(0.58, 0.32 + (dist / steps / 40) * 0.16);
      for (let i = 1; i <= steps; i++) {
        const t = i / steps;
        setNewWave(startX + dx * t, startY + dy * t, strokeOpacity, c.hoverRings, 0.9, 1.05);
      }
    };

    const processPointerPoint = (clientX: number, clientY: number) => {
      const c = cfg();
      if (c.trigger === "click") return;
      const point = localPoint(clientX, clientY);
      if (!point) {
        hasLastPoint = false;
        return;
      }
      if (!hasLastPoint) {
        setNewWave(point[0], point[1], 0.35, c.hoverRings, 0.85, 1.0);
        lastX = point[0];
        lastY = point[1];
        hasLastPoint = true;
        return;
      }
      if (Math.hypot(point[0] - lastX, point[1] - lastY) >= Math.max(2, c.spacing || 5)) {
        emitHoverStroke(lastX, lastY, point[0], point[1]);
        lastX = point[0];
        lastY = point[1];
      }
    };

    const onMove = (event: PointerEvent) => {
      if (!isVisible || !plateReady) return;
      const coalesced = event.getCoalescedEvents?.();
      if (coalesced && coalesced.length > 0) {
        for (let i = 0; i < coalesced.length; i++) processPointerPoint(coalesced[i].clientX, coalesced[i].clientY);
      } else {
        processPointerPoint(event.clientX, event.clientY);
      }
    };

    const onDown = (event: PointerEvent) => {
      if (!isVisible || !plateReady) return;
      const c = cfg();
      if (c.trigger === "hover") return;
      const point = localPoint(event.clientX, event.clientY);
      if (!point) return;
      setNewWave(point[0], point[1], Math.min(1.0, c.clickStrength * 0.45), c.rings, 1.25, 1.3);
      lastX = point[0];
      lastY = point[1];
      hasLastPoint = true;
    };

    const onPointerLeave = () => {
      hasLastPoint = false;
    };

    const target: HTMLElement | Window = initial.interactionTarget?.current ?? window;
    target.addEventListener("pointermove", onMove as EventListener, { passive: true });
    target.addEventListener("pointerdown", onDown as EventListener, { passive: true });
    target.addEventListener("pointerleave", onPointerLeave, { passive: true });

    const loop = (now: number) => {
      if (!isVisible || disposed || contextLost) {
        isLoopRunning = false;
        return;
      }
      const c = cfg();
      const delta = previousTime ? Math.min(0.05, (now - previousTime) / 1000) : 0;
      previousTime = now;
      const growth = 1 - Math.exp(-delta * (c.speed * 1.09));
      const decay = Math.exp((-delta * LIFE_CONSTANT) / Math.max(0.15, c.fade));

      let activeCount = 0;
      for (let i = 0; i < MAX_WAVES; i += 1) {
        const wave = waves[i];
        if (wave.opacity <= 0) {
          opacities[i] = 0;
          continue;
        }
        wave.opacity *= decay;
        wave.scale += (wave.target - wave.scale) * growth;
        if (wave.opacity < 0.002) {
          wave.opacity = 0;
          opacities[i] = 0;
          continue;
        }
        activeCount++;
        const half = (wave.scale * wave.size) / 2;
        offsets[i * 2] = (wave.x / width) * 2 - 1;
        offsets[i * 2 + 1] = (wave.y / height) * 2 - 1;
        scales[i * 2] = (half / width) * 2;
        scales[i * 2 + 1] = (half / height) * 2;
        opacities[i] = wave.opacity;
        ringsArray[i] = wave.rings;
      }

      if (activeCount > 0 || needsRenderAfterClear) {
        geometry.attributes.iOffset.needsUpdate = true;
        geometry.attributes.iScale.needsUpdate = true;
        geometry.attributes.iOpacity.needsUpdate = true;
        geometry.attributes.iRings.needsUpdate = true;
        renderer.render({ scene: waveMesh, target: displacementTarget, clear: true });
        renderComposite();
      }

      if (activeCount > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        // Final clean frame rendered above; sleep until the next interaction.
        needsRenderAfterClear = false;
        isLoopRunning = false;
      }
    };

    // Sleep completely while scrolled out of view.
    const io = new IntersectionObserver(
      (entries) => {
        isVisible = entries[0].isIntersecting;
        if (isVisible) {
          measure();
          if (needsRenderAfterClear) startLoop();
        } else {
          stopLoop();
        }
      },
      { threshold: 0 }
    );
    io.observe(mount);

    // Safari and mobile GPUs can drop contexts under memory pressure; fall
    // back to the static plate instead of leaving a blank hero.
    const onContextLost = (e: Event) => {
      e.preventDefault();
      contextLost = true;
      stopLoop();
      cfg().onFailure?.();
    };
    canvas.addEventListener("webglcontextlost", onContextLost);

    resize();

    return () => {
      disposed = true;
      io.disconnect();
      ro.disconnect();
      stopLoop();
      mediaLists.forEach((mq) => mq.removeEventListener("change", onMediaChange));
      target.removeEventListener("pointermove", onMove as EventListener);
      target.removeEventListener("pointerdown", onDown as EventListener);
      target.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      if (!contextLost) {
        gl.deleteTexture(plateTexture.texture);
        geometry.remove();
        compositeGeometry.remove();
        waveProgram.remove();
        compositeProgram.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      }
      rasterCanvas.width = rasterCanvas.height = 0;
      if (canvas.parentNode === mount) mount.removeChild(canvas);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full overflow-hidden bg-transparent ${className}`.trim()}
      style={style}
    />
  );
};

export default RippleDistortion;
