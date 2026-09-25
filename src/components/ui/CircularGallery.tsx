"use client";

import React, { useEffect, useRef } from "react";
import { Camera, Mesh, Plane, Program, Renderer, Texture, Transform } from "ogl";

type GL = Renderer["gl"];

function debounce<T extends (...args: unknown[]) => void>(func: T, wait: number) {
  let timeout: number;
  return function (this: unknown, ...args: Parameters<T>) {
    window.clearTimeout(timeout);
    timeout = window.setTimeout(() => func.apply(this, args), wait);
  };
}

function lerp(p1: number, p2: number, t: number): number {
  return p1 + (p2 - p1) * t;
}

function autoBind(instance: object): void {
  const proto = Object.getPrototypeOf(instance);
  if (!proto) return;
  Object.getOwnPropertyNames(proto).forEach((key) => {
    if (key !== "constructor") {
      const desc = Object.getOwnPropertyDescriptor(proto, key);
      if (desc && typeof desc.value === "function") {
        (instance as Record<string, unknown>)[key] = desc.value.bind(instance);
      }
    }
  });
}

function getFontSize(font: string): number {
  const match = font.match(/(\d+)px/);
  return match ? parseInt(match[1], 10) : 22;
}

function createTextTexture(
  gl: GL,
  text: string,
  font: string = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  color: string = "#ffffff"
): { texture: Texture; width: number; height: number } {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Could not get 2d context");

  context.font = font;
  const metrics = context.measureText(text);
  const textWidth = Math.ceil(metrics.width);
  const fontSize = getFontSize(font);
  const textHeight = Math.ceil(fontSize * 1.3);

  const dpr = 2;
  const logicalWidth = textWidth + 36;
  const logicalHeight = textHeight + 20;

  canvas.width = logicalWidth * dpr;
  canvas.height = logicalHeight * dpr;

  context.scale(dpr, dpr);
  context.font = font;
  context.fillStyle = color;
  context.textBaseline = "middle";
  context.textAlign = "center";
  context.clearRect(0, 0, logicalWidth, logicalHeight);
  context.fillText(text, logicalWidth / 2, logicalHeight / 2);

  const texture = new Texture(gl, { generateMipmaps: false });
  texture.image = canvas;
  return { texture, width: logicalWidth, height: logicalHeight };
}

interface TitleProps {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor?: string;
  font?: string;
}

class Title {
  gl: GL;
  plane: Mesh;
  renderer: Renderer;
  text: string;
  textColor: string;
  font: string;
  mesh!: Mesh;

  constructor({
    gl,
    plane,
    renderer,
    text,
    textColor = "#ffffff",
    font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  }: TitleProps) {
    autoBind(this);
    this.gl = gl;
    this.plane = plane;
    this.renderer = renderer;
    this.text = text;
    this.textColor = textColor;
    this.font = font;
    this.createMesh();
  }

  createMesh() {
    const { texture, width, height } = createTextTexture(
      this.gl,
      this.text,
      this.font,
      this.textColor
    );
    const geometry = new Plane(this.gl);
    const program = new Program(this.gl, {
      vertex: `
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform sampler2D tMap;
        varying vec2 vUv;
        void main() {
          vec4 color = texture2D(tMap, vUv);
          if (color.a < 0.08) discard;
          gl_FragColor = color;
        }
      `,
      uniforms: { tMap: { value: texture } },
      transparent: true,
    });
    this.mesh = new Mesh(this.gl, { geometry, program });
    const aspect = width / height;
    const textHeightScaled = this.plane.scale.y * 0.14;
    const textWidthScaled = textHeightScaled * aspect;
    this.mesh.scale.set(textWidthScaled, textHeightScaled, 1);
    this.mesh.position.y =
      -this.plane.scale.y * 0.5 - textHeightScaled * 0.5 - 0.08;
    this.mesh.setParent(this.plane);
  }
}

interface ScreenSize {
  width: number;
  height: number;
}

interface Viewport {
  width: number;
  height: number;
}

interface MediaProps {
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius?: number;
  font?: string;
}

class Media {
  extra: number = 0;
  geometry: Plane;
  gl: GL;
  image: string;
  index: number;
  length: number;
  renderer: Renderer;
  scene: Transform;
  screen: ScreenSize;
  text: string;
  viewport: Viewport;
  bend: number;
  textColor: string;
  borderRadius: number;
  font?: string;
  program!: Program;
  plane!: Mesh;
  title!: Title;
  scale!: number;
  padding!: number;
  width!: number;
  widthTotal!: number;
  x!: number;
  speed: number = 0;
  isBefore: boolean = false;
  isAfter: boolean = false;

  constructor({
    geometry,
    gl,
    image,
    index,
    length,
    renderer,
    scene,
    screen,
    text,
    viewport,
    bend,
    textColor,
    borderRadius = 0.17,
    font,
  }: MediaProps) {
    this.geometry = geometry;
    this.gl = gl;
    this.image = image;
    this.index = index;
    this.length = length;
    this.renderer = renderer;
    this.scene = scene;
    this.screen = screen;
    this.text = text;
    this.viewport = viewport;
    this.bend = bend;
    this.textColor = textColor;
    this.borderRadius = borderRadius;
    this.font = font;
    this.createShader();
    this.createMesh();
    this.createTitle();
    this.onResize();
  }

  createShader() {
    const texture = new Texture(this.gl, {
      generateMipmaps: false,
      minFilter: this.gl.LINEAR,
      magFilter: this.gl.LINEAR,
      wrapS: this.gl.CLAMP_TO_EDGE,
      wrapT: this.gl.CLAMP_TO_EDGE,
    });
    this.program = new Program(this.gl, {
      depthTest: false,
      depthWrite: false,
      vertex: `
        precision highp float;
        attribute vec3 position;
        attribute vec2 uv;
        uniform mat4 modelViewMatrix;
        uniform mat4 projectionMatrix;
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragment: `
        precision highp float;
        uniform vec2 uImageSizes;
        uniform vec2 uPlaneSizes;
        uniform sampler2D tMap;
        uniform float uBorderRadius;
        uniform float uSpeed;
        varying vec2 vUv;
        
        float roundedBoxSDF(vec2 p, vec2 b, float r) {
          vec2 d = abs(p) - b;
          return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - r;
        }
        
        void main() {
          // Robust aspect ratio cover calculation
          float imgAspect = (uImageSizes.y > 0.0 && uImageSizes.x > 0.0) ? (uImageSizes.x / uImageSizes.y) : 1.0;
          float planeAspect = (uPlaneSizes.y > 0.0 && uPlaneSizes.x > 0.0) ? (uPlaneSizes.x / uPlaneSizes.y) : 1.0;
          
          vec2 scale = vec2(
            imgAspect > planeAspect ? planeAspect / imgAspect : 1.0,
            imgAspect > planeAspect ? 1.0 : imgAspect / planeAspect
          );
          vec2 uv = (vUv - 0.5) * scale + 0.5;

          // Simple, clean fading motion blur during scroll/drag
          float blurAmount = clamp(abs(uSpeed) * 0.08, 0.0, 0.014);

          vec4 color;
          if (blurAmount > 0.0003) {
            vec2 offset = vec2(sign(uSpeed) * blurAmount, 0.0);
            
            // Smooth 5-tap Gaussian-weighted fading blur
            vec4 s1 = texture2D(tMap, uv - offset * 1.5);
            vec4 s2 = texture2D(tMap, uv - offset * 0.75);
            vec4 s3 = texture2D(tMap, uv);
            vec4 s4 = texture2D(tMap, uv + offset * 0.75);
            vec4 s5 = texture2D(tMap, uv + offset * 1.5);
            
            vec3 blurred = s1.rgb * 0.12 + s2.rgb * 0.22 + s3.rgb * 0.32 + s4.rgb * 0.22 + s5.rgb * 0.12;
            
            // Smooth fade between sharp image and softened motion blur
            float blurFade = smoothstep(0.0003, 0.004, blurAmount);
            color = vec4(mix(s3.rgb, blurred, blurFade), 1.0);
          } else {
            color = texture2D(tMap, uv);
          }
          
          float d = roundedBoxSDF(vUv - 0.5, vec2(0.5 - uBorderRadius), uBorderRadius);
          
          // Smooth antialiasing for card edges
          float edgeSmooth = 0.0025;
          float alpha = 1.0 - smoothstep(-edgeSmooth, edgeSmooth, d);
          
          // Subtle inner vignette for card depth
          float inner = smoothstep(0.0, -0.12, d);
          color.rgb *= mix(0.85, 1.0, inner);

          // Subtle elegant rim highlight
          float rim = 1.0 - smoothstep(0.0, 0.035, abs(d));
          color.rgb += vec3(0.2, 0.04, 0.06) * rim * 0.6;

          gl_FragColor = vec4(color.rgb, alpha);
        }
      `,
      uniforms: {
        tMap: { value: texture },
        uPlaneSizes: { value: [720, 920] },
        uImageSizes: { value: [1200, 900] },
        uSpeed: { value: 0 },
        uTime: { value: 100 * Math.random() },
        uBorderRadius: { value: this.borderRadius },
      },
      transparent: true,
    });
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = this.image;
    img.onload = () => {
      texture.image = img;
      this.program.uniforms.uImageSizes.value = [
        img.naturalWidth,
        img.naturalHeight,
      ];
    };
  }

  createMesh() {
    this.plane = new Mesh(this.gl, {
      geometry: this.geometry,
      program: this.program,
    });
    this.plane.setParent(this.scene);
  }

  createTitle() {
    this.title = new Title({
      gl: this.gl,
      plane: this.plane,
      renderer: this.renderer,
      text: this.text,
      textColor: this.textColor,
      font: this.font,
    });
  }

  update(
    scroll: { current: number; last: number },
    direction: "right" | "left"
  ) {
    this.plane.position.x = this.x - scroll.current - this.extra;

    const x = this.plane.position.x;
    const H = this.viewport.width / 2;

    if (this.bend === 0) {
      this.plane.position.y = 0;
      this.plane.rotation.z = 0;
    } else {
      const B_abs = Math.abs(this.bend);
      const R = (H * H + B_abs * B_abs) / (2 * B_abs);
      const effectiveX = Math.min(Math.abs(x), H);

      const arc = R - Math.sqrt(R * R - effectiveX * effectiveX);
      if (this.bend > 0) {
        this.plane.position.y = -arc;
        this.plane.rotation.z = -Math.sign(x) * Math.asin(effectiveX / R);
      } else {
        this.plane.position.y = arc;
        this.plane.rotation.z = Math.sign(x) * Math.asin(effectiveX / R);
      }
    }

    this.speed = scroll.current - scroll.last;
    this.program.uniforms.uTime.value += 0.03;
    this.program.uniforms.uSpeed.value = this.speed;

    const planeOffset = this.plane.scale.x / 2;
    const viewportOffset = this.viewport.width / 2;
    this.isBefore = this.plane.position.x + planeOffset < -viewportOffset;
    this.isAfter = this.plane.position.x - planeOffset > viewportOffset;
    if (direction === "right" && this.isBefore) {
      this.extra -= this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
    if (direction === "left" && this.isAfter) {
      this.extra += this.widthTotal;
      this.isBefore = this.isAfter = false;
    }
  }

  onResize({
    screen,
    viewport,
  }: { screen?: ScreenSize; viewport?: Viewport } = {}) {
    if (screen) this.screen = screen;
    if (viewport) {
      this.viewport = viewport;
      if (this.plane.program.uniforms.uViewportSizes) {
        this.plane.program.uniforms.uViewportSizes.value = [
          this.viewport.width,
          this.viewport.height,
        ];
      }
    }
    this.scale = this.screen.height / 1500;
    this.plane.scale.y =
      (this.viewport.height * (920 * this.scale)) / this.screen.height;
    this.plane.scale.x =
      (this.viewport.width * (720 * this.scale)) / this.screen.width;
    this.plane.program.uniforms.uPlaneSizes.value = [
      this.plane.scale.x,
      this.plane.scale.y,
    ];
    this.padding = 2;
    this.width = this.plane.scale.x + this.padding;
    this.widthTotal = this.width * this.length;
    this.x = this.width * this.index;
  }
}

export interface CircularGalleryItem {
  image: string;
  text: string;
}

export interface CircularGalleryProps {
  items?: CircularGalleryItem[];
  bend?: number;
  textColor?: string;
  borderRadius?: number;
  font?: string;
  scrollSpeed?: number;
  scrollEase?: number;
  className?: string;
}

class App {
  container: HTMLElement;
  scrollSpeed: number;
  scroll: {
    ease: number;
    current: number;
    target: number;
    last: number;
    position?: number;
  };
  onCheckDebounce: (...args: unknown[]) => void;
  renderer!: Renderer;
  gl!: GL;
  camera!: Camera;
  scene!: Transform;
  planeGeometry!: Plane;
  medias: Media[] = [];
  mediasImages: CircularGalleryItem[] = [];
  screen!: { width: number; height: number };
  viewport!: { width: number; height: number };
  raf: number = 0;
  isLoopRunning: boolean = false;
  isVisible: boolean = true;
  disposed: boolean = false;

  boundOnResize!: () => void;
  boundOnWheel!: (e: Event) => void;
  boundOnTouchDown!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchMove!: (e: MouseEvent | TouchEvent) => void;
  boundOnTouchUp!: () => void;
  boundOnKeyDown!: (e: KeyboardEvent) => void;

  isDown: boolean = false;
  start: number = 0;

  constructor(
    container: HTMLElement,
    {
      items,
      bend = 1,
      textColor = "#ffffff",
      borderRadius = 0.17,
      font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      scrollSpeed = 2.5,
      scrollEase = 0.08,
    }: {
      items?: CircularGalleryItem[];
      bend?: number;
      textColor?: string;
      borderRadius?: number;
      font?: string;
      scrollSpeed?: number;
      scrollEase?: number;
    }
  ) {
    this.container = container;
    this.scrollSpeed = scrollSpeed;
    this.scroll = { ease: scrollEase, current: 0, target: 0, last: 0 };
    this.onCheckDebounce = debounce(this.onCheck.bind(this), 200);
    this.createRenderer();
    this.createCamera();
    this.createScene();
    this.onResize();
    this.createGeometry();
    this.createMedias(items, bend, textColor, borderRadius, font);
    this.addEventListeners();
    this.startLoop();
  }

  createRenderer() {
    const dpr =
      typeof window !== "undefined"
        ? Math.min(window.devicePixelRatio || 1, 2)
        : 1;
    this.renderer = new Renderer({
      alpha: true,
      antialias: true,
      dpr,
    });
    this.gl = this.renderer.gl;
    this.gl.clearColor(0, 0, 0, 0);
    this.container.appendChild(this.renderer.gl.canvas as HTMLCanvasElement);
  }

  createCamera() {
    this.camera = new Camera(this.gl);
    this.camera.fov = 45;
    this.camera.position.z = 20;
  }

  createScene() {
    this.scene = new Transform();
  }

  createGeometry() {
    this.planeGeometry = new Plane(this.gl, {
      heightSegments: 40,
      widthSegments: 60,
    });
  }

  createMedias(
    items: CircularGalleryItem[] | undefined,
    bend: number = 1,
    textColor: string,
    borderRadius: number,
    font: string
  ) {
    const defaultItems: CircularGalleryItem[] = [
      { image: "/assets/case-vyom-interiors.webp", text: "Vyom Interiors • 610K Views" },
      { image: "/assets/case-bucket-list-adventure.webp", text: "Bucket List Adventure • 140K Views" },
      { image: "/assets/case-ayrak-care.webp", text: "Ayrak Care • 4.4K Views" },
      { image: "/assets/case-avitech-automation.webp", text: "Avitech Automation • 1.4K Views" },
    ];
    const galleryItems = items && items.length ? items : defaultItems;
    // Duplicate items to support infinite wrapping
    this.mediasImages = galleryItems.concat(galleryItems).concat(galleryItems);
    this.medias = this.mediasImages.map((data, index) => {
      return new Media({
        geometry: this.planeGeometry,
        gl: this.gl,
        image: data.image,
        index,
        length: this.mediasImages.length,
        renderer: this.renderer,
        scene: this.scene,
        screen: this.screen,
        text: data.text,
        viewport: this.viewport,
        bend,
        textColor,
        borderRadius,
        font,
      });
    });
  }

  onTouchDown(e: MouseEvent | TouchEvent) {
    if (!this.isVisible) return;
    this.isDown = true;
    this.scroll.position = this.scroll.current;
    this.start = "touches" in e ? e.touches[0].clientX : e.clientX;
    this.startLoop();
  }

  onTouchMove(e: MouseEvent | TouchEvent) {
    if (!this.isDown || !this.isVisible) return;
    const x = "touches" in e ? e.touches[0].clientX : e.clientX;
    const distance = (this.start - x) * (this.scrollSpeed * 0.025);
    this.scroll.target = (this.scroll.position ?? 0) + distance;
    this.startLoop();
  }

  onTouchUp() {
    this.isDown = false;
    this.onCheck();
  }

  onWheel(e: Event) {
    if (!this.isVisible) return;
    const wheelEvent = e as WheelEvent & { wheelDelta?: number; detail?: number };
    const delta =
      wheelEvent.deltaY ||
      wheelEvent.wheelDelta ||
      wheelEvent.detail ||
      0;
    this.scroll.target +=
      (delta > 0 ? this.scrollSpeed : -this.scrollSpeed) * 0.22;
    this.onCheckDebounce();
    this.startLoop();
  }

  onKeyDown(e: KeyboardEvent) {
    if (!this.isVisible) return;
    switch (e.key) {
      case "ArrowRight":
        e.preventDefault();
        this.scroll.target += this.scrollSpeed * 5;
        this.onCheckDebounce();
        this.startLoop();
        break;

      case "ArrowLeft":
        e.preventDefault();
        this.scroll.target -= this.scrollSpeed * 5;
        this.onCheckDebounce();
        this.startLoop();
        break;
    }
  }

  onCheck() {
    if (!this.medias || !this.medias[0]) return;
    const width = this.medias[0].width;
    const itemIndex = Math.round(Math.abs(this.scroll.target) / width);
    const item = width * itemIndex;
    this.scroll.target = this.scroll.target < 0 ? -item : item;
    this.startLoop();
  }

  onResize() {
    if (!this.container) return;
    const width = Math.max(1, this.container.clientWidth);
    const height = Math.max(1, this.container.clientHeight);
    this.screen = { width, height };
    this.renderer.setSize(width, height);
    this.camera.perspective({
      aspect: width / height,
    });
    const fov = (this.camera.fov * Math.PI) / 180;
    const viewHeight = 2 * Math.tan(fov / 2) * this.camera.position.z;
    const viewWidth = viewHeight * this.camera.aspect;
    this.viewport = { width: viewWidth, height: viewHeight };
    if (this.medias) {
      this.medias.forEach((media) =>
        media.onResize({ screen: this.screen, viewport: this.viewport })
      );
    }
    this.startLoop();
  }

  startLoop() {
    if (!this.isLoopRunning && this.isVisible && !this.disposed) {
      this.isLoopRunning = true;
      this.raf = window.requestAnimationFrame(this.update.bind(this));
    }
  }

  stopLoop() {
    if (this.isLoopRunning) {
      window.cancelAnimationFrame(this.raf);
      this.isLoopRunning = false;
    }
  }

  update() {
    if (!this.isVisible || this.disposed) {
      this.isLoopRunning = false;
      return;
    }

    this.scroll.current = lerp(
      this.scroll.current,
      this.scroll.target,
      this.scroll.ease
    );
    const direction = this.scroll.current > this.scroll.last ? "right" : "left";
    if (this.medias) {
      this.medias.forEach((media) => media.update(this.scroll, direction));
    }
    this.renderer.render({ scene: this.scene, camera: this.camera });

    const diff = Math.abs(this.scroll.target - this.scroll.current);
    const diffLast = Math.abs(this.scroll.current - this.scroll.last);
    this.scroll.last = this.scroll.current;

    // Settle detection: Pause loop when momentum reaches rest to eliminate idle GPU load
    if (diff < 0.0004 && diffLast < 0.0004 && !this.isDown) {
      this.isLoopRunning = false;
      return;
    }

    this.raf = window.requestAnimationFrame(this.update.bind(this));
  }

  addEventListeners() {
    this.boundOnResize = this.onResize.bind(this);
    this.boundOnWheel = this.onWheel.bind(this);
    this.boundOnTouchDown = this.onTouchDown.bind(this);
    this.boundOnTouchMove = this.onTouchMove.bind(this);
    this.boundOnTouchUp = this.onTouchUp.bind(this);
    this.boundOnKeyDown = this.onKeyDown.bind(this);

    window.addEventListener("resize", this.boundOnResize, { passive: true });
    this.container.addEventListener("wheel", this.boundOnWheel, {
      passive: true,
    });
    this.container.addEventListener("mousedown", this.boundOnTouchDown);
    window.addEventListener("mousemove", this.boundOnTouchMove);
    window.addEventListener("mouseup", this.boundOnTouchUp);
    this.container.addEventListener("touchstart", this.boundOnTouchDown, {
      passive: true,
    });
    window.addEventListener("touchmove", this.boundOnTouchMove, {
      passive: true,
    });
    window.addEventListener("touchend", this.boundOnTouchUp);
    this.container.addEventListener("keydown", this.boundOnKeyDown);
  }

  destroy() {
    this.disposed = true;
    this.stopLoop();
    window.removeEventListener("resize", this.boundOnResize);
    if (this.container) {
      this.container.removeEventListener("wheel", this.boundOnWheel);
      this.container.removeEventListener("mousedown", this.boundOnTouchDown);
      this.container.removeEventListener("touchstart", this.boundOnTouchDown);
      this.container.removeEventListener("keydown", this.boundOnKeyDown);
    }
    window.removeEventListener("mousemove", this.boundOnTouchMove);
    window.removeEventListener("mouseup", this.boundOnTouchUp);
    window.removeEventListener("touchend", this.boundOnTouchUp);
    if (
      this.renderer &&
      this.renderer.gl &&
      this.renderer.gl.canvas.parentNode
    ) {
      this.renderer.gl.canvas.parentNode.removeChild(
        this.renderer.gl.canvas as HTMLCanvasElement
      );
    }
  }
}

export default function CircularGallery({
  items,
  bend = 1,
  textColor = "#ffffff",
  borderRadius = 0.17,
  font = 'bold 22px -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  scrollSpeed = 2.5,
  scrollEase = 0.08,
  className = "",
}: CircularGalleryProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let app: App | undefined = new App(container, {
      items,
      bend,
      textColor,
      borderRadius,
      font,
      scrollSpeed,
      scrollEase,
    });

    // Viewport IntersectionObserver: sleep completely when scrolled out of view
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (app) {
          app.isVisible = entry.isIntersecting;
          if (app.isVisible) {
            app.onResize();
            app.startLoop();
          } else {
            app.stopLoop();
          }
        }
      },
      { threshold: 0.05 }
    );
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (app) {
        app.destroy();
        app = undefined;
      }
    };
  }, [items, bend, textColor, borderRadius, font, scrollSpeed, scrollEase]);

  return (
    <div
      className={`w-full h-full min-h-[360px] sm:min-h-[500px] lg:min-h-[640px] overflow-hidden cursor-grab active:cursor-grabbing select-none relative z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#e51d24]/60 rounded-2xl ${className}`}
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label="Circular image gallery. Drag or scroll to browse campaigns."
    />
  );
}
