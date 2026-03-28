"use client";

import React, { useState } from "react";

interface EmbedChromeProps {
  children: React.ReactNode;
  title?: string;
  url?: string;
  onOpenInArchflow?: () => void;
}

export function EmbedChrome({
  children,
  title = "Architecture Diagram",
  url = "archdraw.app",
  onOpenInArchflow,
}: EmbedChromeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPressed, setIsPressed] = useState(false);

  return (
    <div
      style={{
        background: "linear-gradient(145deg, #0f0f0f, #1a1a1a)",
        borderRadius: "12px",
        overflow: "hidden",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
        border: "1px solid rgba(255, 255, 255, 0.1)",
        minHeight: "400px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          background: "rgba(0, 0, 0, 0.3)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              display: "flex",
              gap: "6px",
            }}
          >
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#ef4444",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#eab308",
              }}
            />
            <div
              style={{
                width: "12px",
                height: "12px",
                borderRadius: "50%",
                background: "#22c55e",
              }}
            />
          </div>
          <div
            style={{
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "6px",
              padding: "6px 12px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginLeft: "8px",
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="rgba(255, 255, 255, 0.5)"
              strokeWidth="0.1"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <span
              style={{
                color: "rgba(255, 255, 255, 0.5)",
                fontSize: "12px",
                fontFamily: "system-ui, sans-serif",
              }}
            >
              {url}
            </span>
          </div>
        </div>

        <button
          onClick={onOpenInArchflow}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => {
            setIsHovered(false);
            setIsPressed(false);
          }}
          onMouseDown={() => setIsPressed(true)}
          onMouseUp={() => setIsPressed(false)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "6px 12px",
            background: isPressed
              ? "rgba(99, 102, 241, 0.8)"
              : isHovered
              ? "rgba(99, 102, 241, 0.9)"
              : "rgba(99, 102, 241, 0.6)",
            border: "none",
            borderRadius: "6px",
            color: "white",
            fontSize: "12px",
            fontWeight: "500",
            fontFamily: "system-ui, sans-serif",
            cursor: "pointer",
            transform: isPressed
              ? "scale(0.95)"
              : isHovered
              ? "scale(1.05)"
              : "scale(1)",
            transition: "all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)",
            boxShadow: isHovered
              ? "0 4px 12px rgba(99, 102, 241, 0.4)"
              : "none",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.1"
          >
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
            <polyline points="15 3 21 3 21 9" />
            <line x1="10" y1="14" x2="21" y2="3" />
          </svg>
          Open in ArchDraw
        </button>
      </div>

      <div
        style={{
          flex: 1,
          position: "relative",
          minHeight: 0,
          background: "linear-gradient(180deg, #0a0a0a 0%, #111111 100%)",
        }}
      >
        {children}
      </div>
    </div>
  );
}
