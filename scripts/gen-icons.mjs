// public/icon-512.svg から PWA 用 PNG アイコンを生成する。
// Android のホーム追加(A2HS)は PNG 192/512 + maskable が必須(SVGだけでは不可)。
// 実行: node scripts/gen-icons.mjs
import sharp from "sharp";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const pub = join(process.cwd(), "public");
const svg = readFileSync(join(pub, "icon-512.svg"));
const BG = "#14130f"; // アイコン背景(ink-900)

// 通常アイコン(purpose: any)
await sharp(svg, { density: 384 }).resize(192, 192).png().toFile(join(pub, "icon-192.png"));
await sharp(svg, { density: 384 }).resize(512, 512).png().toFile(join(pub, "icon-512.png"));

// maskable: 円形/角丸マスクで端が欠けないよう、80%セーフゾーンに内容を縮小配置
const inner = await sharp(svg, { density: 384 }).resize(410, 410).png().toBuffer();
await sharp({ create: { width: 512, height: 512, channels: 4, background: BG } })
  .composite([{ input: inner, gravity: "centre" }])
  .png()
  .toFile(join(pub, "icon-512-maskable.png"));

// apple-touch-icon (iOS は自前で角丸を付けるので四角・背景塗りで出力)
await sharp({ create: { width: 180, height: 180, channels: 4, background: BG } })
  .composite([{ input: await sharp(svg, { density: 384 }).resize(180, 180).png().toBuffer(), gravity: "centre" }])
  .png()
  .toFile(join(pub, "apple-touch-icon.png"));

console.log("✓ icons generated: icon-192.png / icon-512.png / icon-512-maskable.png / apple-touch-icon.png");
