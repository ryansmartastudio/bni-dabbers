import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "BNI Dabbers — business networking in Cheshire East";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fffdf9",
          padding: "64px",
        }}
      >
        <div
          style={{
            height: "8px",
            width: "160px",
            background: "#cf1f2e",
            borderRadius: "999px",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div
            style={{
              fontSize: 72,
              fontWeight: 700,
              letterSpacing: "-0.04em",
              color: "#171412",
              lineHeight: 1,
            }}
          >
            BNI Dabbers
          </div>
          <div
            style={{
              fontSize: 32,
              color: "#5c5752",
              lineHeight: 1.3,
              maxWidth: "900px",
            }}
          >
            Business networking in Nantwich, Crewe and Cheshire East
          </div>
        </div>
        <div style={{ fontSize: 24, color: "#8a8278" }}>
          Thursday mornings · Wychwood Park · Guest visits welcome
        </div>
      </div>
    ),
    {
      ...size,
    },
  );
}
