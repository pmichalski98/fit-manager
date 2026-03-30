import { ImageResponse } from "next/og";

export const size = {
  width: 180,
  height: 180,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
        }}
      >
        <svg
          width="100"
          height="100"
          viewBox="0 0 512 512"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Outer circle */}
          <path
            d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 384c-97.2 0-176-78.8-176-176S158.8 80 256 80s176 78.8 176 176-78.8 176-176 176z"
            fill="#10b981"
          />
          {/* Dumbbell left */}
          <rect
            x="100"
            y="220"
            width="24"
            height="72"
            rx="6"
            fill="#10b981"
          />
          <rect
            x="124"
            y="240"
            width="60"
            height="32"
            rx="4"
            fill="#10b981"
          />
          {/* Dumbbell right */}
          <rect
            x="388"
            y="220"
            width="24"
            height="72"
            rx="6"
            fill="#10b981"
          />
          <rect
            x="328"
            y="240"
            width="60"
            height="32"
            rx="4"
            fill="#10b981"
          />
          {/* Heartbeat line */}
          <path
            d="M184 256 L220 256 L240 200 L270 310 L300 220 L320 256 L388 256"
            stroke="#10b981"
            strokeWidth="16"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
