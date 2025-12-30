/**
 * Download Button Component
 * 
 * Provides functionality to export the mind map as a high-quality PNG image.
 * Uses html-to-image library to capture the ReactFlow viewport.
 */

import { Panel } from "@xyflow/react";
import { toPng } from "html-to-image";

/**
 * Triggers the browser download of the generated image
 * @param dataUrl - Base64 encoded PNG image data
 */
function downloadImage(dataUrl: string): void {
  const a = document.createElement("a");
  a.setAttribute("download", "mindmap.png");
  a.setAttribute("href", dataUrl);
  a.click();
}

/**
 * Download Button Component
 * Renders a button in the top-right corner that exports the mind map
 */
function DownloadButton() {
  const onClick = (): void => {
    // Find the ReactFlow viewport element (contains the actual diagram)
    const viewport = document.querySelector<HTMLElement>(".react-flow__viewport");
    
    if (!viewport) {
      console.error("ReactFlow viewport not found");
      return;
    }

    // Convert to PNG with high quality settings
    toPng(viewport, {
      backgroundColor: "#fff", // White background
      pixelRatio: 10, // 10x resolution for crisp text and graphics
      quality: 1, // Maximum quality (0-1)
    }).then(downloadImage).catch((error) => {
      console.error("Failed to generate image:", error);
    });
  };

  return (
    <Panel position="top-right">
      <button 
        className="download-btn xy-theme__button" 
        onClick={onClick}
        aria-label="Download mind map as PNG image"
      >
        Download Image
      </button>
    </Panel>
  );
}

export default DownloadButton;
