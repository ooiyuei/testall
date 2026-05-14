// ---------------------------------------------------------------------------
// 画像前処理ヘルパー
// Canvas API を使って長辺 1024px に縮小 + JPEG 0.85 再エンコード
// createImageBitmap の imageOrientation: "from-image" で EXIF 自動回転
// 依存ライブラリ: なし（ブラウザ Canvas API のみ）
// ---------------------------------------------------------------------------

const MAX_LONG_EDGE = 1024;
const JPEG_QUALITY = 0.85;
const TARGET_MEDIA_TYPE = "image/jpeg";

export type PreprocessResult = {
  base64: string;
  mediaType: string;
  bytes: number;
};

export async function preprocessImage(file: File): Promise<PreprocessResult> {
  // EXIF orientation を考慮して ImageBitmap に変換
  const bitmap = await createImageBitmap(file, {
    imageOrientation: "from-image",
  });

  const { width, height } = bitmap;
  const { dw, dh } = calcDimensions(width, height);

  const canvas = document.createElement("canvas");
  canvas.width = dw;
  canvas.height = dh;

  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("Canvas 2D context unavailable");
  }

  ctx.drawImage(bitmap, 0, 0, dw, dh);
  bitmap.close();

  return new Promise<PreprocessResult>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Canvas.toBlob returned null"));
          return;
        }
        const reader = new FileReader();
        reader.onload = () => {
          const dataUrl = reader.result as string;
          // "data:image/jpeg;base64," プレフィックスを除去
          const base64 = dataUrl.split(",")[1] ?? "";
          resolve({ base64, mediaType: TARGET_MEDIA_TYPE, bytes: blob.size });
        };
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(blob);
      },
      TARGET_MEDIA_TYPE,
      JPEG_QUALITY,
    );
  });
}

function calcDimensions(
  w: number,
  h: number,
): { dw: number; dh: number } {
  const longEdge = Math.max(w, h);
  if (longEdge <= MAX_LONG_EDGE) {
    return { dw: w, dh: h };
  }
  const ratio = MAX_LONG_EDGE / longEdge;
  return {
    dw: Math.round(w * ratio),
    dh: Math.round(h * ratio),
  };
}
