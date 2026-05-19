"use client";

// バーコードスキャナー (html5-qrcode 利用)
// - EAN-13 (ISBN-13) を検出 → onDetect(isbn) を呼ぶ
// - カメラ権限拒否時は onPermissionDenied を呼ぶ
// - アンマウント時は必ず stop() を呼ぶ
// - Next.js SSR 回避のため、利用側で dynamic(() => import(...), { ssr: false }) する想定

import { useEffect, useRef, useState } from "react";
import { Camera, X, AlertCircle, Loader2 } from "lucide-react";
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type Html5QrcodeResult,
} from "html5-qrcode";

type BarcodeScannerProps = {
  onDetect: (isbn: string) => void;
  onCancel: () => void;
  onManualFallback?: () => void;
};

// 日本書籍は 978 / 491 / 192 で始まる ISBN-13 が多いが、汎用的に EAN-13 全部受ける
function isLikelyIsbn13(code: string): boolean {
  return /^(978|979)[0-9]{10}$/.test(code);
}

const REGION_ID = "testall-barcode-scanner-region";

export function BarcodeScanner({
  onDetect,
  onCancel,
  onManualFallback,
}: BarcodeScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const detectedRef = useRef(false); // 二重発火を防ぐ
  const [status, setStatus] = useState<
    "init" | "starting" | "scanning" | "denied" | "error" | "no-camera"
  >("init");
  const [errMsg, setErrMsg] = useState<string>("");

  useEffect(() => {
    let canceled = false;

    async function start() {
      setStatus("starting");
      try {
        // カメラ一覧を取得 (これで権限プロンプトが出る)
        const cameras = await Html5Qrcode.getCameras();
        if (canceled) return;
        if (!cameras || cameras.length === 0) {
          setStatus("no-camera");
          return;
        }

        const scanner = new Html5Qrcode(REGION_ID, {
          verbose: false,
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
          ],
        });
        scannerRef.current = scanner;

        const onSuccess = (text: string, _result: Html5QrcodeResult) => {
          if (detectedRef.current) return;
          // ISBN-13 のみ受理 (ISBN-10 はバーコード化されない)
          if (!isLikelyIsbn13(text)) return;
          detectedRef.current = true;
          // stop は親でアンマウントするので、ここでは触らず親に投げる
          onDetect(text);
        };

        const onError = () => {
          // 連続して呼ばれる "not found" を黙殺
        };

        // 背面カメラ優先
        const backCamera =
          cameras.find((c) => /back|rear|environment/i.test(c.label)) ??
          cameras[cameras.length - 1];

        await scanner.start(
          backCamera ? { deviceId: { exact: backCamera.id } } : { facingMode: "environment" },
          {
            fps: 10,
            qrbox: (vw, vh) => {
              const m = Math.min(vw, vh);
              // バーコードは横長: 横を広め、縦を狭め
              return {
                width: Math.floor(m * 0.85),
                height: Math.floor(m * 0.35),
              };
            },
            aspectRatio: 1.7777,
          },
          onSuccess,
          onError,
        );
        if (canceled) {
          // アンマウント済みなら止める
          await scanner.stop().catch(() => {});
          return;
        }
        setStatus("scanning");
      } catch (e: unknown) {
        if (canceled) return;
        const msg = e instanceof Error ? e.message : String(e);
        // 権限拒否の典型メッセージを判定
        if (
          /permission|denied|notallowed|notallowederror/i.test(msg)
        ) {
          setStatus("denied");
        } else {
          setStatus("error");
          setErrMsg(msg);
        }
      }
    }

    void start();

    return () => {
      canceled = true;
      const s = scannerRef.current;
      if (s) {
        // stop は scanning 状態でないと例外を投げるので catch で握る
        s.stop()
          .catch(() => {})
          .finally(() => {
            try {
              s.clear();
            } catch {
              // ignore
            }
          });
      }
    };
  }, [onDetect]);

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-ink-900">
      {/* ヘッダー */}
      <div className="flex items-center justify-between px-4 pt-[max(env(safe-area-inset-top),12px)] pb-3 text-white">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4" />
          <span className="text-[13px] font-bold">バーコードをスキャン</span>
        </div>
        <button
          type="button"
          onClick={onCancel}
          aria-label="閉じる"
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* スキャン領域 */}
      <div className="relative flex-1 overflow-hidden">
        <div
          id={REGION_ID}
          className="absolute inset-0 [&_video]:h-full [&_video]:w-full [&_video]:object-cover"
        />

        {/* ガイド枠オーバーレイ */}
        {status === "scanning" ? (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <div className="relative h-[28%] w-[78%] rounded-xl border-2 border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]">
              <span className="absolute -top-2 left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-mint-400" />
              <span className="absolute -top-2 right-0 h-2 w-2 translate-x-1/2 rounded-full bg-mint-400" />
              <span className="absolute -bottom-2 left-0 h-2 w-2 -translate-x-1/2 rounded-full bg-mint-400" />
              <span className="absolute -bottom-2 right-0 h-2 w-2 translate-x-1/2 rounded-full bg-mint-400" />
            </div>
          </div>
        ) : null}

        {/* ステータスメッセージ */}
        {status !== "scanning" ? (
          <div className="absolute inset-0 flex items-center justify-center p-6">
            <div className="rounded-2xl bg-white/95 p-5 text-center shadow-pop">
              {status === "init" || status === "starting" ? (
                <>
                  <Loader2 className="mx-auto h-5 w-5 animate-spin text-ink-500" />
                  <p className="mt-2 text-[12px] font-bold text-ink-700">
                    カメラを起動中…
                  </p>
                </>
              ) : null}
              {status === "denied" ? (
                <>
                  <AlertCircle className="mx-auto h-5 w-5 text-coral-500" />
                  <p className="mt-2 text-[13px] font-bold text-ink-900">
                    カメラの利用が許可されていません
                  </p>
                  <p className="mt-1 text-[11px] text-ink-500">
                    ブラウザ設定でカメラを許可するか、ISBN を直接入力してください。
                  </p>
                  {onManualFallback ? (
                    <button
                      type="button"
                      onClick={onManualFallback}
                      className="mt-3 inline-flex h-9 items-center rounded-full bg-ink-900 px-4 text-[11px] font-bold text-white"
                    >
                      ISBN を手入力
                    </button>
                  ) : null}
                </>
              ) : null}
              {status === "no-camera" ? (
                <>
                  <AlertCircle className="mx-auto h-5 w-5 text-coral-500" />
                  <p className="mt-2 text-[13px] font-bold text-ink-900">
                    カメラが見つかりません
                  </p>
                  {onManualFallback ? (
                    <button
                      type="button"
                      onClick={onManualFallback}
                      className="mt-3 inline-flex h-9 items-center rounded-full bg-ink-900 px-4 text-[11px] font-bold text-white"
                    >
                      ISBN を手入力
                    </button>
                  ) : null}
                </>
              ) : null}
              {status === "error" ? (
                <>
                  <AlertCircle className="mx-auto h-5 w-5 text-coral-500" />
                  <p className="mt-2 text-[13px] font-bold text-ink-900">
                    スキャンを開始できません
                  </p>
                  {errMsg ? (
                    <p className="mt-1 break-words text-[10px] text-ink-400">
                      {errMsg}
                    </p>
                  ) : null}
                  {onManualFallback ? (
                    <button
                      type="button"
                      onClick={onManualFallback}
                      className="mt-3 inline-flex h-9 items-center rounded-full bg-ink-900 px-4 text-[11px] font-bold text-white"
                    >
                      ISBN を手入力
                    </button>
                  ) : null}
                </>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {/* フッター */}
      <div className="px-5 pb-[max(env(safe-area-inset-bottom),16px)] pt-4 text-center text-white/80">
        <p className="text-[11px]">
          書籍裏のバーコード (978 から始まる方) を枠に合わせてください
        </p>
        {onManualFallback && status === "scanning" ? (
          <button
            type="button"
            onClick={onManualFallback}
            className="mt-3 text-[11px] font-bold text-white underline-offset-2 active:underline"
          >
            ISBN を手入力する
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default BarcodeScanner;
