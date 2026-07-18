import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** PNG fallback for browsers that don't use SVG favicons well */
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
          fontSize: 26,
          lineHeight: 1,
        }}
      >
        🔥
      </div>
    ),
    { ...size },
  );
}
