/**
 * Mind Map Component
 * 
 * A hierarchical mind map visualization using ReactFlow.
 * Automatically positions nodes in a tree layout with centered parent nodes.
 * Supports unlimited depth with color-coded levels.
 */

import { Background, Controls, ReactFlow } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { useMemo, type FC } from "react";
import DownloadButton from "./download-button";

/**
 * Data structure for mind map nodes
 * Each node contains text and optional children
 */
export type MindMapData = {
  text: string;
  children?: MindMapData[];
};

/**
 * Props for the MindMap component
 */
export interface MindMapProps {
  data?: MindMapData;
}

/**
 * Generates nodes and edges for the mind map using a tree layout algorithm
 * 
 * Algorithm:
 * 1. Processes children first (post-order traversal)
 * 2. Positions each parent node centered vertically relative to its children
 * 3. Calculates cumulative height to prevent overlapping
 * 
 * @param data - The mind map data to process
 * @param parentId - ID of the parent node (null for root)
 * @param nodes - Accumulator array for nodes
 * @param edges - Accumulator array for edges
 * @param level - Current depth level (0 = root)
 * @param index - Index among siblings
 * @param yOffset - Current vertical offset in pixels
 * @returns Object containing nodes, edges, and total height
 */
function generateMindMapNodesAndEdges(
  data: MindMapData,
  parentId: string | null = null,
  nodes: any[] = [],
  edges: any[] = [],
  level: number = 0,
  index: number = 0,
  yOffset: number = 0
): { nodes: any[]; edges: any[]; height: number } {
  // Generate unique ID for this node
  const nodeId = parentId ? `${parentId}-${index}` : "n0";
  
  // Layout constants
  const nodeHeight = 120; // Vertical spacing between leaf nodes
  const levelWidth = 300; // Horizontal spacing between hierarchy levels

  let currentY = yOffset;

  if (data.children && data.children.length > 0) {
    // STEP 1: Process all children recursively (post-order traversal)
    // This ensures children are positioned before we calculate parent position
    const childHeights: number[] = [];
    data.children.forEach((child) => {
      const childResult = generateMindMapNodesAndEdges(
        child,
        nodeId,
        nodes,
        edges,
        level + 1,
        childHeights.length,
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
    const lastChildIndex = data.children.length - 1;
    const lastChildY =
      nodes.find((n) => n.id === `${nodeId}-${lastChildIndex}`)?.position.y ||
      yOffset;

    // Center parent vertically between first and last child
    const centerY = (firstChildY + lastChildY) / 2;

    // STEP 3: Create the parent node
    nodes.push({
      id: nodeId,
      position: { x: level * levelWidth, y: centerY },
      data: { label: data.text },
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
    // BASE CASE: Leaf node (no children)
    // Position directly at current Y offset
    nodes.push({
      id: nodeId,
      position: { x: level * levelWidth, y: currentY },
      data: { label: data.text },
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
  // Memoize node/edge generation to avoid recalculation on re-renders
  const { nodes, edges } = useMemo(() => {
    return generateMindMapNodesAndEdges(data);
  }, [data]);

  return (
    <div style={{ height: "100%", width: "100%", position: "relative" }}>
      <ReactFlow
        // Disable interactions - this is a static visualization
        nodesDraggable={false}
        nodesConnectable={false}
        nodesFocusable={false}
        edgesFocusable={false}
        elementsSelectable={false}
        
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
