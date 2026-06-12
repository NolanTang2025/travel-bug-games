import { useEffect, useState } from "react";
import QRCode from "qrcode";

type Props = {
  url: string;
  size?: number;
  className?: string;
};

/** 本地生成 QR，不依赖外网 api.qrserver.com */
export function PlayQrCode({ url, size = 220, className = "" }: Props) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setFailed(false);
    QRCode.toDataURL(url, {
      width: size,
      margin: 2,
      color: { dark: "#1a1a24", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then((src) => {
        if (!cancelled) setDataUrl(src);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
    };
  }, [url, size]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center border-2 border-dashed border-riso-ink/30 bg-white font-mono text-[10px] text-muted-foreground text-center p-4 ${className}`}
        style={{ width: size, height: size }}
      >
        QR failed
        <br />
        Open the link below instead
      </div>
    );
  }

  if (!dataUrl) {
    return (
      <div
        className={`animate-pulse rounded-sm bg-riso-ink/5 ${className}`}
        style={{ width: size, height: size }}
        aria-hidden
      />
    );
  }

  return (
    <img
      src={dataUrl}
      alt=""
      width={size}
      height={size}
      className={`block bg-white ${className}`}
    />
  );
}
