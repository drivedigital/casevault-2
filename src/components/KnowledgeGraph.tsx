"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
  type Node,
  type Edge,
  type NodeProps,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Scale, User, Building2, FileText, Lightbulb, Loader2 } from "lucide-react";

type ApiNode = {
  id: string;
  type: "matter" | "contact" | "document" | "claim" | "concept";
  label: string;
  sublabel?: string;
  position: { x: number; y: number };
};

type ApiEdge = {
  id: string;
  source: string;
  target: string;
  label?: string;
  kind: string;
};

const NODE_STYLES: Record<string, { bg: string; border: string; icon: typeof Scale }> = {
  matter: { bg: "#ecfdf5", border: "#10b981", icon: Scale },
  contact: { bg: "#f5f3ff", border: "#8b5cf6", icon: User },
  document: { bg: "#eff6ff", border: "#3b82f6", icon: FileText },
  claim: { bg: "#fff7ed", border: "#f97316", icon: Building2 },
  concept: { bg: "#fdf2f8", border: "#ec4899", icon: Lightbulb },
};

function GraphNode({ data }: NodeProps) {
  const nodeData = data as unknown as { kind: string; label: string; sublabel?: string };
  const style = NODE_STYLES[nodeData.kind] ?? NODE_STYLES.concept;
  const Icon = style.icon;
  return (
    <div
      className="max-w-[220px] rounded-xl border-2 px-3 py-2 shadow-sm"
      style={{ backgroundColor: style.bg, borderColor: style.border }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <div className="flex items-center gap-1.5">
        <Icon size={13} style={{ color: style.border }} />
        <p className="truncate text-xs font-semibold text-slate-800">{nodeData.label}</p>
      </div>
      {nodeData.sublabel ? <p className="truncate text-[10px] text-slate-500">{nodeData.sublabel}</p> : null}
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </div>
  );
}

const nodeTypes = { graphNode: GraphNode };

export function KnowledgeGraph({ matterId }: { matterId?: number }) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const [loading, setLoading] = useState(true);

  const fetchGraph = useCallback(async () => {
    const url = matterId ? `/api/graph?matterId=${matterId}` : "/api/graph";
    const res = await fetch(url);
    const data: { nodes: ApiNode[]; edges: ApiEdge[] } = await res.json();

    setNodes(
      data.nodes.map((n) => ({
        id: n.id,
        type: "graphNode",
        position: n.position,
        data: { kind: n.type, label: n.label, sublabel: n.sublabel },
      })),
    );
    setEdges(
      data.edges.map((e) => ({
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
        animated: e.kind.startsWith("fact-adverse"),
        style: {
          stroke: e.kind.startsWith("fact-adverse") ? "#f43f5e" : e.kind.startsWith("fact-supporting") ? "#10b981" : "#94a3b8",
        },
        labelStyle: { fontSize: 10, fill: "#64748b" },
      })),
    );
    setLoading(false);
  }, [matterId, setNodes, setEdges]);

  useEffect(() => {
    const timer = setTimeout(() => { void fetchGraph(); }, 0);
    return () => clearTimeout(timer);
  }, [fetchGraph]);

  const legend = useMemo(
    () => [
      { label: "Matter", color: "#10b981" },
      { label: "Contact", color: "#8b5cf6" },
      { label: "Document", color: "#3b82f6" },
      { label: "Claim", color: "#f97316" },
      { label: "Concept", color: "#ec4899" },
    ],
    [],
  );

  return (
    <div className="relative h-[680px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white">
      {loading ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/70">
          <Loader2 className="animate-spin text-slate-400" size={28} />
        </div>
      ) : null}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        minZoom={0.2}
      >
        <Background gap={18} color="#e2e8f0" />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={() => "#c7d2fe"} maskColor="rgba(241,245,249,0.6)" />
      </ReactFlow>
      <div className="absolute bottom-4 left-4 z-10 flex flex-wrap gap-3 rounded-lg bg-white/90 px-3 py-2 text-[11px] shadow">
        {legend.map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}
