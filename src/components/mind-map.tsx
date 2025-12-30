/**
 * Mind Map Component
 *
 * A hierarchical mind map visualization using ReactFlow.
 * Automatically positions nodes in a tree layout with centered parent nodes.
 * Supports unlimited depth with color-coded levels.
 */

import {
  Background,
  Controls,
  ReactFlow,
  Handle,
  Position,
  type NodeProps,
  useReactFlow,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, type FC, useState, useCallback } from "react";
import DownloadButton from "./download-button";

export type MindMapData = {
  text: string;
  children?: MindMapData[];
};

export interface MindMapProps {
  data?: MindMapData;
}

const CustomNode = ({ data, id }: NodeProps) => {
  const { label, hasChildren, isCollapsed, onToggle } = data as any;
  const { fitView } = useReactFlow();

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "transparent", opacity: 0 }}
      />
      <div>{label}</div>

      {hasChildren && (
        <Handle
          type="source"
          className="collapse-toggle"
          onClick={(e) => {
            e.stopPropagation();
            onToggle(id);
            fitView({ padding: 0.2, duration: 500 });
          }}
          position={Position.Right}
        >
          {isCollapsed ? ">" : "<"}
        </Handle>
      )}
    </div>
  );
};

const nodeTypes = {
  custom: CustomNode,
};

function generateMindMapNodesAndEdges(
  data: MindMapData,
  collapsedNodes: Set<string>,
  onToggle: (id: string) => void,
  parentId: string | null = null,
  nodes: any[] = [],
  edges: any[] = [],
  level: number = 0,
  index: number = 0,
  yOffset: number = 0
): { nodes: any[]; edges: any[]; height: number } {
  const nodeId = parentId ? `${parentId}-${index}` : "n0";
  const nodeHeight = 120; // Vertical spacing between leaf nodes
  const levelWidth = 300; // Horizontal spacing between hierarchy levels

  let currentY = yOffset;
  const isCollapsed = collapsedNodes.has(nodeId);
  const hasChildren = !!data.children && data.children.length > 0;

  if (hasChildren && !isCollapsed) {
    // STEP 1: Process all children recursively (post-order traversal)
    // This ensures children are positioned before we calculate parent position
    const childHeights: number[] = [];
    data.children!.forEach((child, childIndex) => {
      const childResult = generateMindMapNodesAndEdges(
        child,
        collapsedNodes,
        onToggle,
        nodeId,
        nodes,
        edges,
        level + 1,
        childIndex,
        currentY
      );
      childHeights.push(childResult.height);
      currentY += childResult.height; // Accumulate vertical space
    });

    // STEP 2: Calculate parent position (centered between first and last child)
    const totalHeight = childHeights.reduce((sum, h) => sum + h, 0);

    // Find Y positions of first and last children
    const firstChildY =
      nodes.find((n) => n.id === `${nodeId}-0`)?.position.y || yOffset;
    const lastChildIndex = data.children!.length - 1;
    const lastChildY =
      nodes.find((n) => n.id === `${nodeId}-${lastChildIndex}`)?.position.y ||
      yOffset;

    // Center parent vertically between first and last child
    const centerY = (firstChildY + lastChildY) / 2;

    // STEP 3: Create the parent node
    nodes.push({
      id: nodeId,
      type: "custom",
      position: { x: level * levelWidth, y: centerY },
      data: { label: data.text, hasChildren, isCollapsed, onToggle },
      className: `custom-node level-${level}`, // Color-coded by depth
      sourcePosition: "right", // Connections exit from the right
      targetPosition: "left", // Connections enter from the left
    });

    // STEP 4: Create edge connecting to parent (if not root)
    if (parentId) {
      edges.push({
        id: `e${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        className: "custom-edge",
        sourcePosition: "right",
        targetPosition: "left",
      });
    }

    return { nodes, edges, height: totalHeight };
  } else {
    // BASE CASE: Leaf node (no children) or Collapsed Node
    // Position directly at current Y offset
    nodes.push({
      id: nodeId,
      type: "custom",
      position: { x: level * levelWidth, y: currentY },
      data: { label: data.text, hasChildren, isCollapsed, onToggle },
      className: `custom-node level-${level}`,
      sourcePosition: "right",
      targetPosition: "left",
    });

    // Create edge connecting to parent
    if (parentId) {
      edges.push({
        id: `e${parentId}-${nodeId}`,
        source: parentId,
        target: nodeId,
        className: "custom-edge",
        sourcePosition: "right",
        targetPosition: "left",
      });
    }

    // Return single node height for parent centering calculation
    return { nodes, edges, height: nodeHeight };
  }
}

/**
 * Main MindMap Component
 * Renders the mind map visualization with controls
 */
export const MindMap: FC<MindMapProps> = ({ data = { text: "Root" } }) => {
  const [collapsedNodes, setCollapsedNodes] = useState<Set<string>>(new Set());

  const onToggle = useCallback((id: string) => {
    setCollapsedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  // Memoize node/edge generation to avoid recalculation on re-renders
  const { nodes, edges } = useMemo(() => {
    return generateMindMapNodesAndEdges(data, collapsedNodes, onToggle);
  }, [data, collapsedNodes, onToggle]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <ReactFlow
        // Disable interactions - this is a static visualization
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        nodeTypes={nodeTypes}
        // Data
        nodes={nodes}
        edges={edges}
        // View settings
        minZoom={0.01} // Allow zooming out very far
        maxZoom={10} // Allow detailed zoom
        fitView // Auto-fit content on initial render
        attributionPosition="bottom-left"
      >
        {/* Download button in top-right panel */}
        <DownloadButton />

        {/* Background pattern for visual reference */}
        <Background />

        {/* Zoom/pan controls (interactive = false means read-only) */}
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};
