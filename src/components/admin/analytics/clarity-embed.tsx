"use client";

interface ClarityEmbedProps {
  projectId: string;
  type: "heatmaps" | "recordings";
}

export function ClarityEmbed({ projectId, type }: ClarityEmbedProps) {
  const url = `https://clarity.microsoft.com/projects/view/${projectId}/${type}`;

  return (
    <iframe
      src={url}
      className="w-full h-[600px] border rounded-lg"
      sandbox="allow-scripts allow-same-origin"
      title={`Clarity ${type}`}
    />
  );
}
