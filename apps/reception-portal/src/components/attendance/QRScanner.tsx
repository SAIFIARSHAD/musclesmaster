import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  type CameraDevice,
} from 'html5-qrcode';
import {
  Camera,
  CameraOff,
  ScanLine,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
interface QRScannerProps {
  onScan: (decodedText: string) => Promise<void> | void;
}

const SCANNER_ELEMENT_ID = 'reception-qr-reader';

export default function QRScanner({ onScan }: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const mountedRef = useRef(false);
  const busyRef = useRef(false);
  const restartTimerRef = useRef<number | null>(null);

  const onScanRef = useRef(onScan);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCamera, setSelectedCamera] = useState('');
  const [status, setStatus] = useState<
    'loading' | 'scanning' | 'error' | 'stopped'
  >('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  const stopScanner = useCallback(async () => {
    const scanner = scannerRef.current;

    if (!scanner) return;

    try {
      if (scanner.isScanning) {
        await scanner.stop();
      }
    } catch {
      // Scanner may already be stopped.
    }
  }, []);

  const startScanner = useCallback(
    async (cameraId?: string) => {
      if (!mountedRef.current || busyRef.current) return;

      try {
        setStatus('loading');
        setError('');

        let availableCameras = cameras;

        if (availableCameras.length === 0) {
          availableCameras = await Html5Qrcode.getCameras();

          if (!mountedRef.current) return;

          setCameras(availableCameras);
        }

        if (availableCameras.length === 0) {
          throw new Error('No camera found on this device.');
        }

        const cameraToUse =
          cameraId ||
          selectedCamera ||
          availableCameras.find((camera) =>
            /back|rear|environment/i.test(camera.label),
          )?.id ||
          availableCameras[0].id;

        setSelectedCamera(cameraToUse);

        let scanner = scannerRef.current;

        if (!scanner) {
          scanner = new Html5Qrcode(SCANNER_ELEMENT_ID, {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false,
          });

          scannerRef.current = scanner;
        }

        if (scanner.isScanning) return;

        await scanner.start(
          cameraToUse,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            if (busyRef.current || !mountedRef.current) return;

            busyRef.current = true;

            setStatus('loading');

            await stopScanner();

            try {
              await onScanRef.current(decodedText);
            } finally {
              if (mountedRef.current) {
                restartTimerRef.current = window.setTimeout(() => {
                  busyRef.current = false;
                  void startScanner(cameraToUse);
                }, 700);
              } else {
                busyRef.current = false;
              }
            }
          },
          () => {
            // Ignore continuous QR decoding errors.
          },
        );

        if (mountedRef.current) {
          setStatus('scanning');
        }
      } catch (err: unknown) {
        if (!mountedRef.current) return;

        setError(
          err instanceof Error
            ? err.message
            : 'Unable to start camera. Check camera permissions.',
        );

        setStatus('error');

        const scanner = scannerRef.current;

        if (scanner) {
          try {
            if (scanner.isScanning) await scanner.stop();
          } catch {
            // Ignore cleanup errors.
          }

          scanner.clear();
          scannerRef.current = null;
        }
      }
    },
    [cameras, selectedCamera, stopScanner],
  );

  useEffect(() => {
    mountedRef.current = true;
    void startScanner();

    return () => {
      mountedRef.current = false;

      if (restartTimerRef.current !== null) {
        window.clearTimeout(restartTimerRef.current);
      }

      const scanner = scannerRef.current;

      if (scanner?.isScanning) {
        void scanner.stop().catch(() => undefined);
      }

      scanner?.clear();
      scannerRef.current = null;
    };
    // Start once when the scanner component mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStop = async () => {
    if (restartTimerRef.current !== null) {
      window.clearTimeout(restartTimerRef.current);
    }

    busyRef.current = true;
    await stopScanner();

    setStatus('stopped');
  };

  const handleStart = () => {
    busyRef.current = false;
    void startScanner();
  };

  const handleCameraChange = async (cameraId: string) => {
    busyRef.current = true;
    await stopScanner();

    const scanner = scannerRef.current;

    if (scanner) {
      scanner.clear();
      scannerRef.current = null;
    }

    setSelectedCamera(cameraId);
    busyRef.current = false;

    void startScanner(cameraId);
  };

  const isScanning = status === 'scanning' || status === 'loading';

  return (
    <section className="h-full min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-slate-100 px-4 py-4">
        <div className="min-w-0">
          <h2 className="text-base font-extrabold text-slate-900">
            Scan Member QR
          </h2>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            Place the member QR code inside the camera frame.
          </p>
        </div>

        <span
          className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold ${
            status === 'scanning'
              ? 'bg-emerald-50 text-emerald-700'
              : status === 'error'
                ? 'bg-red-50 text-red-700'
                : status === 'stopped'
                  ? 'bg-slate-100 text-slate-600'
                  : 'bg-blue-50 text-blue-700'
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              status === 'scanning'
                ? 'animate-pulse bg-emerald-500'
                : status === 'error'
                  ? 'bg-red-500'
                  : status === 'stopped'
                    ? 'bg-slate-400'
                    : 'animate-pulse bg-blue-500'
            }`}
          />

          {status === 'scanning'
            ? 'Camera Active'
            : status === 'loading'
              ? 'Starting'
              : status === 'error'
                ? 'Camera Error'
                : 'Camera Stopped'}
        </span>
      </div>

      <div className="p-3 sm:p-4">
        <div className="relative overflow-hidden rounded-xl bg-[#101B2D]">
          <div
            id={SCANNER_ELEMENT_ID}
            className="min-h-[230px] w-full overflow-hidden sm:min-h-[250px] [&_video]:!w-full [&_video]:!rounded-xl [&_video]:!object-cover"
          />

          {(status === 'error' || status === 'stopped') && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#101B2D] px-5 text-center">
              {status === 'error' ? (
                <CameraOff size={30} className="text-red-400" />
              ) : (
                <ScanLine size={30} className="text-orange-400" />
              )}

              <h3 className="mt-3 text-sm font-bold text-white">
                {status === 'error'
                  ? 'Camera unavailable'
                  : 'Scanner stopped'}
              </h3>

              <p className="mt-1 max-w-xs text-xs leading-5 text-slate-300">
                {error || 'Start the scanner to continue attendance.'}
              </p>
            </div>
          )}
        </div>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,1fr)_auto]">
          {cameras.length > 1 && (
            <label className="flex min-w-0 items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
              <Camera size={16} className="shrink-0 text-slate-500" />

              <select
                value={selectedCamera}
                onChange={(event) => handleCameraChange(event.target.value)}
                disabled={isScanning}
                className="min-w-0 flex-1 bg-transparent py-3 text-xs font-semibold text-slate-700 outline-none disabled:opacity-50"
              >
                {cameras.map((camera, index) => (
                  <option key={camera.id} value={camera.id}>
                    {camera.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </label>
          )}

          {isScanning ? (
            <button
              type="button"
              onClick={handleStop}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-50 px-4 py-3 text-xs font-bold text-red-600 transition hover:bg-red-100"
            >
              <CameraOff size={16} />
              Stop Scanner
            </button>
          ) : (
            <button
              type="button"
              onClick={handleStart}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#F4510B] px-4 py-3 text-xs font-bold text-white transition hover:bg-orange-600"
            >
              <RefreshCw size={16} />
              Start Scanner
            </button>
          )}
        </div>

        {error && status === 'error' && (
          <div className="mt-3 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 border-t border-slate-100 bg-slate-50/70 px-4 py-3">
        <ShieldCheck size={16} className="shrink-0 text-emerald-600" />

        <p className="text-[11px] leading-5 text-slate-500">
          QR token is verified securely. The original token is never displayed.
        </p>
      </div>
    </section>
  );
}