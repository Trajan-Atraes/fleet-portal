import { useState, useEffect, useRef } from "react";
import Quagga from "@ericblade/quagga2";

/**
 * BarcodeScanner — camera-based barcode scanner with manual entry fallback.
 *
 * Props:
 *   onScan(barcode: string) — called when barcode is detected or manually entered
 *   onClose()               — close the scanner modal
 */
export default function BarcodeScanner({ onScan, onClose }) {
  const [manual, setManual] = useState("");
  const [error, setError]   = useState("");
  const [cameraActive, setCameraActive] = useState(false);
  const viewfinderRef = useRef(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;

    const start = () => {
      Quagga.init(
        {
          inputStream: {
            type: "LiveStream",
            target: viewfinderRef.current,
            constraints: {
              facingMode: "environment",
              width: { ideal: 640 },
              height: { ideal: 480 },
            },
          },
          decoder: {
            readers: [
              "upc_reader",
              "upc_e_reader",
              "ean_reader",
              "ean_8_reader",
              "code_128_reader",
              "code_39_reader",
            ],
          },
          locate: true,
          frequency: 10,
        },
        (err) => {
          if (err) {
            if (!stoppedRef.current) {
              setError("Camera not available. Use manual entry below.");
            }
            return;
          }
          if (!stoppedRef.current) {
            Quagga.start();
            setCameraActive(true);
          }
        }
      );

      Quagga.onDetected((result) => {
        if (stoppedRef.current) return;
        const code = result?.codeResult?.code;
        if (!code) return;
        stoppedRef.current = true;
        Quagga.stop();
        onScan(code.trim());
      });
    };

    start();

    return () => {
      stoppedRef.current = true;
      Quagga.offDetected();
      Quagga.stop();
    };
  }, []);

  const handleManual = () => {
    const val = manual.trim();
    if (!val) return;
    stoppedRef.current = true;
    Quagga.stop();
    onScan(val);
  };

  /* Force Quagga's video + canvas to fill the viewfinder container */
  const viewfinderCss = `
    .barcode-viewfinder video,
    .barcode-viewfinder canvas {
      width: 100% !important;
      height: 100% !important;
      object-fit: cover;
      position: absolute;
      top: 0;
      left: 0;
    }
    .barcode-viewfinder canvas.drawingBuffer {
      pointer-events: none;
    }
  `;

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(7,11,17,0.92)", zIndex: 1000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: 0,
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <style>{viewfinderCss}</style>

      <div style={{
        background: "var(--surface)", borderRadius: 0, width: "100%", height: "100%",
        display: "flex", flexDirection: "column", overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "center",
          padding: "14px 20px", flexShrink: 0,
          borderBottom: "1px solid var(--border)",
        }}>
          <div style={{
            fontFamily: "'Barlow Condensed',sans-serif", fontSize: 16, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.12em", color: "var(--white)",
          }}>Scan Barcode</div>
          <button onClick={onClose} style={{
            background: "none", border: "none", color: "var(--muted)", cursor: "pointer",
            fontSize: 22, lineHeight: 1, padding: 4,
          }}>×</button>
        </div>

        {/* Camera viewfinder — fills available space */}
        <div style={{
          flex: 1, minHeight: 0, position: "relative", overflow: "hidden",
          background: "#000",
        }}>
          <div
            ref={viewfinderRef}
            className="barcode-viewfinder"
            style={{ width: "100%", height: "100%", position: "relative" }}
          />
          {/* Scan guide overlay */}
          {cameraActive && (
            <div style={{
              position: "absolute", inset: 0, display: "flex",
              alignItems: "center", justifyContent: "center", pointerEvents: "none",
            }}>
              <div style={{
                width: "75%", maxWidth: 320, height: 100,
                border: "2px solid rgba(245,158,11,0.6)", borderRadius: 8,
              }} />
            </div>
          )}
        </div>

        {error && (
          <div style={{
            fontSize: 12, color: "var(--accent)", background: "var(--accent-dim)",
            border: "1px solid var(--accent-rim)",
            padding: "8px 14px", margin: "0", flexShrink: 0,
          }}>{error}</div>
        )}

        {cameraActive && (
          <div style={{
            fontSize: 11, color: "var(--muted)", textAlign: "center",
            padding: "8px 0", background: "var(--surface)", flexShrink: 0,
          }}>
            Point camera at barcode. Scanning automatically…
          </div>
        )}

        {/* Manual fallback — pinned to bottom */}
        <div style={{
          borderTop: "1px solid var(--border)", padding: "14px 20px",
          background: "var(--surface)", flexShrink: 0,
        }}>
          <div style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase",
            color: "var(--muted)", marginBottom: 8,
          }}>Or enter barcode manually</div>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              value={manual}
              onChange={e => setManual(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") handleManual(); }}
              placeholder="Type or paste barcode…"
              style={{
                flex: 1, background: "var(--raised)", border: "1px solid var(--border)", borderRadius: 5,
                padding: "7px 10px", fontSize: 13, color: "var(--white)", outline: "none",
                fontFamily: "'Barlow',sans-serif",
              }}
            />
            <button
              onClick={handleManual}
              className="btn btn-primary btn-sm"
            >Look Up</button>
          </div>
        </div>
      </div>
    </div>
  );
}
