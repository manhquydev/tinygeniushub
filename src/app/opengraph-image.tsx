import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "TinyGeniusHub - Early learning platform for children 2-6 years old";
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = "image/png";

async function loadAssetDataUri(relativePath: string) {
  const file = await readFile(join(process.cwd(), "public", relativePath));
  return `data:image/png;base64,${file.toString("base64")}`;
}

export default async function Image() {
  const [logoHorizon, appIcon] = await Promise.all([
    loadAssetDataUri("logos/tinygeniushub_logo_horizon.png"),
    loadAssetDataUri("logos/tinygeniushub_app_icon.png"),
  ]);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          background:
            "radial-gradient(circle at 15% 18%, rgba(34,197,94,0.24) 0%, rgba(34,197,94,0) 42%), radial-gradient(circle at 88% 82%, rgba(14,165,233,0.24) 0%, rgba(14,165,233,0) 40%), linear-gradient(160deg, #f8fafc 0%, #ecfeff 52%, #fefce8 100%)",
          color: "#0f172a",
          fontFamily: "Be Vietnam Pro, Arial, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 28,
            padding: "28px 38px",
            borderRadius: 32,
            border: "1px solid rgba(15,23,42,0.09)",
            background: "rgba(255,255,255,0.82)",
            boxShadow: "0 22px 48px rgba(15,23,42,0.14)",
          }}
        >
          <img
            src={appIcon}
            alt=""
            width={132}
            height={132}
            style={{ objectFit: "contain" }}
          />
          <img
            src={logoHorizon}
            alt="TinyGeniusHub"
            width={760}
            height={322}
            style={{ objectFit: "contain" }}
          />
        </div>

        <div
          style={{
            marginTop: 30,
            fontSize: 44,
            fontWeight: 800,
            letterSpacing: "-0.02em",
            color: "#0f172a",
          }}
        >
          Math & English for children 2-6 years old
        </div>

        <div
          style={{
            marginTop: 10,
            fontSize: 28,
            fontWeight: 700,
            color: "#0f766e",
          }}
        >
          15 minutes a day - see clear progress
        </div>
      </div>
    ),
    { ...size },
  );
}
