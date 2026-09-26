/**
 * WebGL layer of the homepage topology. Loaded with a dynamic import only when
 * the hero is visible and WebGL is available; the SVG underneath stays the
 * baseline. The scene matches the SVG frame exactly, so swapping layers is a
 * cross-fade, not a re-layout.
 *
 * Rendering is on demand: a frame is drawn when something changes (hover,
 * theme, resize) and the loop only keeps running while a damped value, the
 * signal ring or a data signal is still moving. Nothing renders while the
 * canvas is off-screen or the tab is hidden.
 *
 * Draw calls: node faces, node outlines, edges + arrows, ring, signal.
 */
import {
  BoxGeometry,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  LineBasicMaterial,
  LineSegments,
  Mesh,
  MeshBasicMaterial,
  OrthographicCamera,
  Raycaster,
  RingGeometry,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { PLINTH, edges, frame, neighbours, nodes, signalPath, toWorld } from '../lib/topology';

export interface TopologyScene {
  /** Emphasise one node (hover, focus or selection); null restores the resting state. */
  emphasise(id: string | null): void;
  /** Short signal ring around a node. */
  ring(id: string): void;
  /** Send one data signal along the documented path. */
  playSignal(): void;
  /** Rendering is allowed only while the canvas is on-screen and the tab is visible. */
  setRunning(running: boolean): void;
  /** Diagnostics for ?debug=topology (development only). */
  stats(): {
    drawCalls: number;
    triangles: number;
    raf: 'active' | 'idle';
    running: boolean;
    dpr: number;
  };
  destroy(): void;
}

interface Options {
  canvas: HTMLCanvasElement;
  labels: Map<string, HTMLElement>;
  /** Which motion may run; see topologyMotion() in lib/topology-state. */
  motion: { signal: boolean; ring: boolean; parallax: boolean };
  onHover(id: string | null): void;
  onPick(id: string): void;
}

const TILT = (5 * Math.PI) / 180;
const VIEW = new Vector3(1, 1, 1).normalize();

/** Colours come from tokens.css; nothing theme-specific is written here. */
function readTokens() {
  const css = getComputedStyle(document.documentElement);
  const token = (name: string) => new Color(css.getPropertyValue(name).trim());
  return {
    bg: token('--bg'),
    top: token('--topo-top'),
    left: token('--topo-left'),
    right: token('--topo-right'),
    line: token('--line'),
    lineStrong: token('--line-strong'),
    accent: token('--accent'),
    data: token('--data'),
  };
}

export function createTopologyScene(options: Options): TopologyScene {
  const { canvas, labels, motion } = options;
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);

  const scene = new Scene();
  const camera = new OrthographicCamera(frame.minX, frame.maxX, -frame.minY, -frame.maxY, 0.1, 100);
  const DISTANCE = 30;

  let colors = readTokens();
  let emphasis: string | null = null;

  // --- Node faces: top + the two sides the camera can see, one mesh for all nodes.
  const FACE_VERTS = 18; // 3 faces × 2 triangles × 3 vertices
  const facePositions = new Float32Array(nodes.length * FACE_VERTS * 3);
  const faceColors = new Float32Array(nodes.length * FACE_VERTS * 3);
  const OUTLINE_VERTS = 18; // 9 segments
  const outlinePositions = new Float32Array(nodes.length * OUTLINE_VERTS * 3);
  const outlineColors = new Float32Array(nodes.length * OUTLINE_VERTS * 3);

  nodes.forEach((n, i) => {
    const { x, z } = toWorld(n.u, n.v);
    const h = PLINTH.half;
    const t = PLINTH.height;
    const A = [x - h, t, z - h];
    const B = [x + h, t, z - h];
    const C = [x + h, t, z + h];
    const D = [x - h, t, z + h];
    const Bb = [x + h, 0, z - h];
    const Cb = [x + h, 0, z + h];
    const Db = [x - h, 0, z + h];
    const faces = [A, D, C, A, C, B, B, C, Cb, B, Cb, Bb, D, C, Cb, D, Cb, Db];
    faces.forEach((p, k) => facePositions.set(p, (i * FACE_VERTS + k) * 3));
    const outline = [A, B, B, C, C, D, D, A, C, Cb, D, Db, B, Bb, Db, Cb, Cb, Bb];
    outline.forEach((p, k) => outlinePositions.set(p, (i * OUTLINE_VERTS + k) * 3));
  });

  const faceGeometry = new BufferGeometry();
  faceGeometry.setAttribute('position', new BufferAttribute(facePositions, 3));
  faceGeometry.setAttribute('color', new BufferAttribute(faceColors, 3));
  const faceMaterial = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  const faceMesh = new Mesh(faceGeometry, faceMaterial);
  scene.add(faceMesh);

  const outlineGeometry = new BufferGeometry();
  outlineGeometry.setAttribute('position', new BufferAttribute(outlinePositions, 3));
  outlineGeometry.setAttribute('color', new BufferAttribute(outlineColors, 3));
  const outlineMaterial = new LineBasicMaterial({ vertexColors: true });
  scene.add(new LineSegments(outlineGeometry, outlineMaterial));

  // --- Edges: screen-facing ribbons (constant on-screen width) plus arrowheads, one mesh.
  const directed = edges.filter((e) => e.directed).length;
  const EDGE_VERTS = edges.length * 6 + directed * 3;
  const edgePositions = new Float32Array(EDGE_VERTS * 3);
  const edgeColors = new Float32Array(EDGE_VERTS * 3);
  const edgeGeometry = new BufferGeometry();
  edgeGeometry.setAttribute('position', new BufferAttribute(edgePositions, 3));
  edgeGeometry.setAttribute('color', new BufferAttribute(edgeColors, 3));
  const edgeMaterial = new MeshBasicMaterial({ vertexColors: true, side: DoubleSide });
  scene.add(new Mesh(edgeGeometry, edgeMaterial));

  // World positions are fixed; hot paths copy from these instead of allocating.
  const ground = new Map(
    nodes.map((n) => {
      const { x, z } = toWorld(n.u, n.v);
      return [n.id, new Vector3(x, 0, z)] as const;
    }),
  );
  const worldOf = (id: string, y = 0.02) => ground.get(id)!.clone().setY(y);

  function layoutEdges(unitPx: number) {
    const half = 0.65 / unitPx; // ≈ 1.3 CSS px wide on screen
    let k = 0;
    const put = (v: Vector3) => edgePositions.set([v.x, v.y, v.z], k++ * 3);
    for (const e of edges) {
      const a = worldOf(e.from);
      const b = worldOf(e.to);
      const dir = b.clone().sub(a).normalize();
      const off = new Vector3().crossVectors(dir, VIEW).normalize().multiplyScalar(half);
      put(a.clone().add(off));
      put(a.clone().sub(off));
      put(b.clone().add(off));
      put(a.clone().sub(off));
      put(b.clone().sub(off));
      put(b.clone().add(off));
    }
    for (const e of edges.filter((e) => e.directed)) {
      const a = worldOf(e.from);
      const b = worldOf(e.to);
      const dir = b.clone().sub(a).normalize();
      const off = new Vector3().crossVectors(dir, VIEW).normalize();
      const mid = a.clone().lerp(b, 0.5);
      const size = 5 / unitPx;
      put(mid.clone().addScaledVector(dir, size));
      put(
        mid
          .clone()
          .addScaledVector(dir, -size)
          .addScaledVector(off, size * 0.8),
      );
      put(
        mid
          .clone()
          .addScaledVector(dir, -size)
          .addScaledVector(off, -size * 0.8),
      );
    }
    edgeGeometry.attributes.position!.needsUpdate = true;
    edgeGeometry.computeBoundingSphere();
  }

  // --- Signal ring and data signal: one reusable object each.
  const ringGeometry = new RingGeometry(0.96, 1, 64);
  ringGeometry.rotateX(-Math.PI / 2);
  const ringMaterial = new MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 });
  const ringMesh = new Mesh(ringGeometry, ringMaterial);
  ringMesh.visible = false;
  scene.add(ringMesh);

  const signalGeometry = new BoxGeometry(0.16, 0.16, 0.16);
  const signalMaterial = new MeshBasicMaterial();
  const signalMesh = new Mesh(signalGeometry, signalMaterial);
  signalMesh.visible = false;
  scene.add(signalMesh);

  // --- Colour state
  const mix = (c: Color, to: Color, t: number) => c.clone().lerp(to, t);

  function paint(activeEdges = new Set<number>()) {
    const c = colors;
    const focus = emphasis;
    const near = new Set(focus ? [focus, ...neighbours(focus)] : []);
    const dim = (col: Color, id: string) => (focus && !near.has(id) ? mix(col, c.bg, 0.62) : col);

    nodes.forEach((n, i) => {
      const on = n.id === focus;
      const top = on ? mix(c.top, c.accent, 0.32) : dim(c.top, n.id);
      const right = on ? mix(c.right, c.accent, 0.18) : dim(c.right, n.id);
      const left = on ? mix(c.left, c.accent, 0.24) : dim(c.left, n.id);
      const perFace = [top, right, left];
      for (let k = 0; k < FACE_VERTS; k++)
        perFace[Math.floor(k / 6)]!.toArray(faceColors, (i * FACE_VERTS + k) * 3);
      const stroke = on ? c.accent : dim(c.lineStrong, n.id);
      for (let k = 0; k < OUTLINE_VERTS; k++)
        stroke.toArray(outlineColors, (i * OUTLINE_VERTS + k) * 3);
    });

    const edgeColor = (i: number) => {
      const e = edges[i]!;
      if (activeEdges.has(i)) return c.data;
      if (!focus) return c.lineStrong;
      return e.from === focus || e.to === focus ? c.data : mix(c.line, c.bg, 0.5);
    };
    edges.forEach((_, i) => {
      const col = edgeColor(i);
      for (let k = 0; k < 6; k++) col.toArray(edgeColors, (i * 6 + k) * 3);
    });
    let arrow = 0;
    edges.forEach((e, i) => {
      if (!e.directed) return;
      const col = edgeColor(i);
      for (let k = 0; k < 3; k++) col.toArray(edgeColors, (edges.length * 6 + arrow * 3 + k) * 3);
      arrow++;
    });

    ringMaterial.color.copy(c.accent);
    signalMaterial.color.copy(c.data);
    faceGeometry.attributes.color!.needsUpdate = true;
    outlineGeometry.attributes.color!.needsUpdate = true;
    edgeGeometry.attributes.color!.needsUpdate = true;
  }

  // --- Camera: fixed isometric view, optional ±5° damped inspection tilt.
  const tilt = { x: 0, y: 0, tx: 0, ty: 0 };
  const AXIS_Y = new Vector3(0, 1, 0);
  const AXIS_RIGHT = new Vector3(1, 0, -1).normalize();
  const cameraDir = new Vector3();
  function placeCamera() {
    cameraDir.copy(VIEW).applyAxisAngle(AXIS_Y, tilt.x).applyAxisAngle(AXIS_RIGHT, tilt.y);
    camera.position.copy(cameraDir).multiplyScalar(DISTANCE);
    camera.up.set(0, 1, 0);
    camera.lookAt(0, 0, 0);
    camera.updateMatrixWorld();
  }

  // HTML labels ride along with the tilt so they stay attached to their plinth.
  const rest = new Map<string, Vector2>();
  const scratch = new Vector3();
  const labelPoint = new Vector2();
  function screenOf(id: string, out: Vector2) {
    scratch.copy(ground.get(id)!).project(camera);
    return out.set(((scratch.x + 1) / 2) * size.w, ((1 - scratch.y) / 2) * size.h);
  }
  function syncLabels() {
    for (const n of nodes) {
      const el = labels.get(n.id);
      const base = rest.get(n.id);
      if (!el || !base) continue;
      screenOf(n.id, labelPoint);
      el.style.translate = `${(labelPoint.x - base.x).toFixed(2)}px ${(labelPoint.y - base.y).toFixed(2)}px`;
    }
  }

  // --- Sizing
  const size = { w: 1, h: 1 };
  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    size.w = rect.width;
    size.h = rect.height;
    const coarse = matchMedia('(pointer: coarse)').matches;
    renderer.setPixelRatio(Math.min(devicePixelRatio, coarse ? 1.5 : 2));
    renderer.setSize(size.w, size.h, false);
    layoutEdges(size.w / frame.width);
    const saved = { x: tilt.x, y: tilt.y };
    tilt.x = tilt.y = 0;
    placeCamera();
    for (const n of nodes) rest.set(n.id, screenOf(n.id, new Vector2()));
    tilt.x = saved.x;
    tilt.y = saved.y;
    placeCamera();
    syncLabels();
    requestFrame();
  }

  // --- Animation state (all optional; the scene is complete without it)
  let ringStart = -1;
  let ringNode = '';
  let signalStart = -1;
  let signalSeg = -1;
  const litEdges = new Set<number>();
  const SIGNAL_MS = 1600;
  const RING_MS = 520;
  const pathEdges = signalPath.slice(1).map((to, i) => {
    const from = signalPath[i]!;
    return edges.findIndex(
      (e) => (e.from === from && e.to === to) || (e.from === to && e.to === from),
    );
  });

  function step(now: number): boolean {
    let busy = false;

    const k = 1 - Math.exp(-(1 / 60) * 9);
    tilt.x += (tilt.tx - tilt.x) * k;
    tilt.y += (tilt.ty - tilt.y) * k;
    if (Math.abs(tilt.tx - tilt.x) > 1e-4 || Math.abs(tilt.ty - tilt.y) > 1e-4) busy = true;
    placeCamera();

    if (ringStart >= 0) {
      const t = (now - ringStart) / RING_MS;
      if (t >= 1) {
        ringStart = -1;
        ringMesh.visible = false;
      } else {
        const eased = 1 - (1 - t) ** 3;
        ringMesh.position.copy(ground.get(ringNode)!).setY(0.01);
        ringMesh.scale.setScalar(PLINTH.half * (1.5 + eased * 0.9));
        ringMaterial.opacity = 0.7 * (1 - t);
        ringMesh.visible = true;
        busy = true;
      }
    }

    if (signalStart >= 0) {
      const t = (now - signalStart) / SIGNAL_MS;
      if (t >= 1) {
        signalStart = -1;
        signalMesh.visible = false;
        paint();
      } else {
        // Linear: data moves at constant speed along the path.
        const segs = signalPath.length - 1;
        const at = t * segs;
        const seg = Math.min(Math.floor(at), segs - 1);
        signalMesh.position
          .copy(ground.get(signalPath[seg]!)!)
          .lerp(ground.get(signalPath[seg + 1]!)!, at - seg)
          .setY(0.1);
        signalMesh.visible = true;
        // Recolour only when the signal enters a new edge, not every frame.
        if (seg !== signalSeg) {
          signalSeg = seg;
          litEdges.clear();
          for (const i of pathEdges.slice(0, seg + 1)) litEdges.add(i);
          paint(litEdges);
        }
        busy = true;
      }
    }
    return busy;
  }

  // --- On-demand loop, gated by visibility.
  let raf = 0;
  let running = false;
  let disposed = false;
  function requestFrame() {
    if (!raf && running && !disposed) raf = requestAnimationFrame(tick);
  }
  function tick(now: number) {
    raf = 0;
    const busy = step(now);
    renderer.render(scene, camera);
    syncLabels();
    if (busy) requestFrame();
  }

  // --- Picking
  const raycaster = new Raycaster();
  const pointer = new Vector2();
  let hovered: string | null = null;
  function pick(event: PointerEvent): string | null {
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObject(faceMesh, false)[0];
    return hit?.faceIndex != null ? nodes[Math.floor(hit.faceIndex / 6)]!.id : null;
  }

  const onMove = (event: PointerEvent) => {
    const id = pick(event);
    if (id !== hovered) {
      hovered = id;
      canvas.style.cursor = id ? 'pointer' : '';
      options.onHover(id);
    }
    if (motion.parallax && event.pointerType === 'mouse') {
      const rect = canvas.getBoundingClientRect();
      tilt.tx = ((event.clientX - rect.left) / rect.width - 0.5) * 2 * TILT;
      tilt.ty = ((event.clientY - rect.top) / rect.height - 0.5) * 2 * TILT * 0.6;
      requestFrame();
    }
  };
  const onLeave = () => {
    tilt.tx = tilt.ty = 0;
    if (hovered) {
      hovered = null;
      canvas.style.cursor = '';
      options.onHover(null);
    }
    requestFrame();
  };
  const onClick = (event: PointerEvent) => {
    const id = pick(event);
    if (id) options.onPick(id);
  };
  const onTheme = () => {
    colors = readTokens();
    paint();
    requestFrame();
  };

  canvas.addEventListener('pointermove', onMove, { passive: true });
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick as EventListener);
  document.addEventListener('themechange', onTheme);
  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(canvas);

  paint();
  placeCamera();

  return {
    emphasise(id) {
      emphasis = id;
      paint();
      requestFrame();
    },
    ring(id) {
      if (!motion.ring) return;
      ringNode = id;
      ringStart = performance.now();
      requestFrame();
    },
    playSignal() {
      if (!motion.signal) return;
      signalStart = performance.now();
      signalSeg = -1;
      requestFrame();
    },
    stats() {
      return {
        drawCalls: renderer.info.render.calls,
        triangles: renderer.info.render.triangles,
        raf: raf ? 'active' : 'idle',
        running,
        dpr: renderer.getPixelRatio(),
      };
    },
    setRunning(next) {
      running = next;
      if (running) {
        resize();
        requestFrame();
      } else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    destroy() {
      disposed = true;
      running = false;
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      resizeObserver.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('click', onClick as EventListener);
      document.removeEventListener('themechange', onTheme);
      for (const g of [faceGeometry, outlineGeometry, edgeGeometry, ringGeometry, signalGeometry])
        g.dispose();
      for (const m of [faceMaterial, outlineMaterial, edgeMaterial, ringMaterial, signalMaterial])
        m.dispose();
      scene.clear();
      renderer.dispose();
      renderer.forceContextLoss();
      labels.forEach((el) => (el.style.translate = ''));
    },
  };
}
