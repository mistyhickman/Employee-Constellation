import { useEffect, useMemo, useRef, useState } from "react";
import ForceGraph2D, { type ForceGraphMethods, type NodeObject, type LinkObject } from "react-force-graph-2d";
import { Plus, Minus, RotateCcw } from "lucide-react";
import { CATEGORY_LABELS, NODE_COLORS, type ConstellationData, type ConstellationNode, type ConstellationNodeType } from "../lib/constellation";
import { avatarHue, initials } from "../lib/avatar";
import { useReducedMotion } from "../hooks/useReducedMotion";

interface ConstellationViewProps {
  data: ConstellationData;
  height?: number;
  onNodeClick?: (node: ConstellationNode) => void;
}

const SELF_HUE = 231; // indigo, matches the app's primary color

function isCenterNode(n: ConstellationNode): boolean {
  return n.id === "self";
}

function isPersonLike(type: ConstellationNodeType): boolean {
  return type === "person" || type === "connection";
}

function nodeRadius(n: ConstellationNode): number {
  if (isCenterNode(n)) return 26;
  if (n.isCategory) return 20;
  if (n.type === "connection") return 16;
  return (n.val ?? 2) + 3;
}

function linkSourceId(link: LinkObject<ConstellationNode>): string {
  const source = link.source;
  return typeof source === "object" ? (source.id as string) : (source as string);
}

// Module-level so images loaded once (e.g. viewing the same person from two
// different centered views) don't get re-fetched/re-decoded. nodeCanvasObject
// runs on every animation frame and can't await a load, so this returns the
// image only once it's actually ready and kicks off loading otherwise —
// callers fall back to the initials avatar for any frame where it's null.
const imageCache = new Map<string, HTMLImageElement>();

function getLoadedImage(url: string, onLoad: () => void): HTMLImageElement | null {
  const cached = imageCache.get(url);
  if (cached) return cached.complete ? cached : null;
  const img = new Image();
  img.onload = onLoad;
  img.src = url;
  imageCache.set(url, img);
  return null;
}

export function ConstellationView({ data, height = 320, onNodeClick }: ConstellationViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const graphRef = useRef<ForceGraphMethods<NodeObject<ConstellationNode>> | undefined>(undefined);
  const [width, setWidth] = useState(600);
  const { effective: prefersReducedMotion } = useReducedMotion();

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) setWidth(entry.contentRect.width);
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const graph = graphRef.current;
    if (!graph) return;
    // Default force spacing is tuned for small dots; the avatar/category-pill
    // nodes are much bigger, so give everything more room or they visually
    // overlap even though the simulation considers them "resolved". The
    // hub-and-spoke hierarchy also reads better with two distinct ring
    // distances: center -> category further out than category -> leaf.
    graph.d3Force("charge")?.strength(-220);
    graph.d3Force("link")?.distance((link: LinkObject<ConstellationNode>) => (linkSourceId(link) === "self" ? 130 : 60));
    graph.d3ReheatSimulation();
  }, [data]);

  const summary = summarize(data.nodes);
  const presentTypes = useMemo(
    () => Array.from(new Set(data.nodes.filter((n) => !isCenterNode(n) && !n.isCategory).map((n) => n.type))) as ConstellationNodeType[],
    [data.nodes],
  );

  function zoomBy(factor: number) {
    const graph = graphRef.current;
    if (!graph) return;
    graph.zoom(graph.zoom() * factor, 200);
  }

  function resetView() {
    graphRef.current?.zoomToFit(300, 40);
  }

  return (
    <div>
      <div
        ref={containerRef}
        role="img"
        aria-label={summary}
        className="constellation-space relative overflow-hidden rounded-lg"
      >
        <ForceGraph2D
          ref={graphRef}
          graphData={data}
          width={width}
          height={height}
          backgroundColor="rgba(0,0,0,0)"
          warmupTicks={prefersReducedMotion ? 100 : 0}
          cooldownTicks={prefersReducedMotion ? 0 : undefined}
          cooldownTime={prefersReducedMotion ? 0 : 1500}
          onEngineStop={() => graphRef.current?.zoomToFit(400, 40)}
          enableZoomInteraction={!prefersReducedMotion}
          enablePanInteraction={!prefersReducedMotion}
          enableNodeDrag={!prefersReducedMotion}
          nodeLabel={(node) => (node as ConstellationNode).label}
          onNodeClick={onNodeClick ? (node) => onNodeClick(node as ConstellationNode) : undefined}
          nodePointerAreaPaint={(node, color, ctx) => {
            const n = node as ConstellationNode & { x: number; y: number };
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(n.x, n.y, nodeRadius(n) + 4, 0, 2 * Math.PI);
            ctx.fill();
          }}
          linkColor={(link) => {
            const target = link.target as ConstellationNode & { type?: ConstellationNodeType };
            const color = NODE_COLORS[target.type ?? "skill"];
            return withAlpha(color, 0.45);
          }}
          linkWidth={1}
          nodeCanvasObject={(node, ctx, globalScale) => {
            const n = node as ConstellationNode & { x: number; y: number };
            if (!Number.isFinite(n.x) || !Number.isFinite(n.y)) return;
            const color = NODE_COLORS[n.type];

            if (n.isCategory) {
              const fontSize = Math.max(11 / globalScale, 4);
              ctx.font = `700 ${fontSize}px sans-serif`;
              const textWidth = ctx.measureText(n.label).width;
              const padX = 10 / globalScale;
              const padY = 6 / globalScale;
              const rectW = textWidth + padX * 2;
              const rectH = fontSize + padY * 2;
              const x = n.x - rectW / 2;
              const y = n.y - rectH / 2;
              const cornerRadius = rectH / 2;

              ctx.save();
              ctx.shadowColor = color;
              ctx.shadowBlur = 10;
              ctx.beginPath();
              ctx.roundRect(x, y, rectW, rectH, cornerRadius);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.restore();

              ctx.beginPath();
              ctx.roundRect(x, y, rectW, rectH, cornerRadius);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.7)";
              ctx.lineWidth = 1;
              ctx.stroke();

              ctx.textAlign = "center";
              ctx.textBaseline = "middle";
              ctx.fillStyle = "#ffffff";
              ctx.fillText(n.label, n.x, n.y + 0.5);
              return;
            }

            const radius = nodeRadius(n);
            const isCenter = isCenterNode(n);

            if (isPersonLike(n.type)) {
              const hue = n.type === "person" ? SELF_HUE : avatarHue(n.entityId);
              const gradient = ctx.createLinearGradient(n.x, n.y - radius, n.x, n.y + radius);
              gradient.addColorStop(0, `hsl(${hue}, 75%, 68%)`);
              gradient.addColorStop(1, `hsl(${hue}, 70%, 46%)`);

              ctx.save();
              ctx.shadowColor = `hsl(${hue}, 80%, 60%)`;
              ctx.shadowBlur = isCenter ? 24 : 14;
              ctx.beginPath();
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = gradient;
              ctx.fill();
              ctx.restore();

              const photo = n.photoUrl ? getLoadedImage(n.photoUrl, () => graphRef.current?.d3ReheatSimulation()) : null;
              if (photo) {
                ctx.save();
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
                ctx.clip();
                ctx.drawImage(photo, n.x - radius, n.y - radius, radius * 2, radius * 2);
                ctx.restore();
              } else {
                const initialsFontSize = Math.max((radius * (isCenter ? 0.62 : 0.68)) / globalScale, 4);
                ctx.font = `600 ${initialsFontSize}px sans-serif`;
                ctx.textAlign = "center";
                ctx.textBaseline = "middle";
                ctx.fillStyle = "#ffffff";
                ctx.fillText(initials(n.label), n.x, n.y + 0.5);
              }

              ctx.beginPath();
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
              ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
              ctx.lineWidth = isCenter ? 2.5 : 1.5;
              ctx.stroke();
            } else {
              ctx.save();
              ctx.shadowColor = color;
              ctx.shadowBlur = isCenter ? 20 : 10;
              ctx.beginPath();
              ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
              ctx.fillStyle = color;
              ctx.fill();
              ctx.restore();

              if (isCenter) {
                ctx.beginPath();
                ctx.arc(n.x, n.y, radius, 0, 2 * Math.PI);
                ctx.strokeStyle = "rgba(255, 255, 255, 0.85)";
                ctx.lineWidth = 2.5;
                ctx.stroke();
              }
            }

            const fontSize = Math.max((isCenter ? 13 : 10) / globalScale, isCenter ? 5 : 3);
            ctx.font = `${isCenter ? "600" : "400"} ${fontSize}px sans-serif`;
            ctx.textAlign = "center";
            ctx.textBaseline = "top";
            ctx.fillStyle = "#e2e8f0";
            ctx.fillText(n.label, n.x, n.y + radius + 3);
          }}
        />

        <div className="absolute bottom-2 right-2 flex gap-1">
          <IconButton label="Zoom in" onClick={() => zoomBy(1.3)} icon={Plus} />
          <IconButton label="Zoom out" onClick={() => zoomBy(1 / 1.3)} icon={Minus} />
          <IconButton label="Reset view" onClick={resetView} icon={RotateCcw} />
        </div>
      </div>

      {presentTypes.length > 0 && (
        <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1" aria-hidden="true">
          {presentTypes.map((type) => (
            <li key={type} className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: NODE_COLORS[type] }} />
              {CATEGORY_LABELS[type]}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-2 text-xs text-slate-400">
        Visual only — everything shown here is also listed in the sections above.
      </p>
    </div>
  );
}

function IconButton({ label, onClick, icon: Icon }: { label: string; onClick: () => void; icon: typeof Plus }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-7 w-7 items-center justify-center rounded-md bg-white/10 text-slate-100 backdrop-blur hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-400"
    >
      <Icon size={14} aria-hidden="true" />
    </button>
  );
}

function withAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function summarize(nodes: ConstellationNode[]): string {
  const leaves = nodes.filter((n) => !isCenterNode(n) && !n.isCategory);
  const counts = leaves.reduce<Record<string, number>>((acc, n) => {
    acc[n.type] = (acc[n.type] ?? 0) + 1;
    return acc;
  }, {});
  const parts = (Object.keys(CATEGORY_LABELS) as ConstellationNodeType[])
    .filter((type) => type !== "person" && counts[type])
    .map((type) => `${counts[type]} ${CATEGORY_LABELS[type].toLowerCase()}`);

  return parts.length === 0 ? "This constellation is empty so far." : `This constellation: connected to ${parts.join(", ")}.`;
}
