import { useEffect, useRef, useState, useCallback } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export interface FaceTrackingData {
  blinkLeft: number;
  blinkRight: number;
  mouthOpen: number;
  headTilt: number;
  eyeGazeX: number;
  eyeGazeY: number;
  smile: number;
  browRaise: number;
  browFurrow: number;
}

const WASM_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14/wasm';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

function cameraError(e: unknown): string {
  if (e instanceof DOMException) {
    if (e.name === 'NotReadableError' || e.name === 'TrackStartError') {
      return 'Camera hardware could not start. Try: refresh the page, use a different browser, or restart your browser completely.';
    }
    if (e.name === 'NotAllowedError') return 'Camera permission denied — click the camera icon in your address bar and allow access.';
    if (e.name === 'NotFoundError')   return 'No camera detected. Plug in a webcam and try again.';
    if (e.name === 'AbortError')      return 'Camera request was aborted. Try again.';
    return `Camera error (${e.name}): ${e.message}`;
  }
  return e instanceof Error ? e.message : 'Unknown error';
}

export function useWebcamTracking() {
  const [isActive,  setIsActive]  = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error,     setError]     = useState<string | null>(null);
  const [data,      setData]      = useState<FaceTrackingData | null>(null);
  const [videoEl,   setVideoEl]   = useState<HTMLVideoElement | null>(null);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef     = useRef<MediaStream | null>(null);
  const videoRef      = useRef<HTMLVideoElement | null>(null);
  const rafRef        = useRef<number>(0);
  const lastTimeRef   = useRef(0);
  const smoothRef     = useRef<FaceTrackingData>({
    blinkLeft: 0, blinkRight: 0, mouthOpen: 0, headTilt: 0,
    eyeGazeX: 0, eyeGazeY: 0, smile: 0, browRaise: 0, browFurrow: 0,
  });

  // Always clean up before a new attempt
  const cleanup = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    void landmarkerRef.current?.close();
    landmarkerRef.current = null;
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      videoRef.current = null;
    }
    streamRef.current = null;
  }, []);

  const start = useCallback(async () => {
    cleanup(); // release any leftover stream from a previous attempt
    setIsLoading(true);
    setError(null);
    setData(null);

    // ── Step 1: camera access (separate so we get a clear error) ──────────
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user' },
        audio: false,
      });
    } catch (e) {
      setError(cameraError(e));
      setIsLoading(false);
      return;
    }
    streamRef.current = stream;

    // ── Step 2: set up video element ───────────────────────────────────────
    const video = document.createElement('video');
    video.srcObject = stream;
    video.autoplay = true;
    video.muted    = true;
    video.playsInline = true;

    try {
      await new Promise<void>((resolve, reject) => {
        video.onloadeddata = () => resolve();
        video.onerror      = () => reject(new Error('Video element failed to load'));
        setTimeout(() => reject(new Error('Camera timed out — try refreshing the page')), 10_000);
      });
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      setError(e instanceof Error ? e.message : 'Video failed to start');
      setIsLoading(false);
      return;
    }
    videoRef.current = video;
    setVideoEl(video);

    // ── Step 3: load MediaPipe (try GPU, fall back to CPU) ─────────────────
    let lm: FaceLandmarker;
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      // Try GPU first; if it throws, retry with CPU
      try {
        lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
      } catch {
        lm = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: { modelAssetPath: MODEL_URL, delegate: 'CPU' },
          outputFaceBlendshapes: true,
          outputFacialTransformationMatrixes: true,
          runningMode: 'VIDEO',
          numFaces: 1,
        });
      }
    } catch (e) {
      stream.getTracks().forEach(t => t.stop());
      setError('Failed to load face-tracking model. Check your internet connection.');
      setIsLoading(false);
      return;
    }
    landmarkerRef.current = lm;
    setIsActive(true);
    setIsLoading(false);

    // ── Detect loop ────────────────────────────────────────────────────────
    const detect = (timestamp: number) => {
      if (!landmarkerRef.current || !videoRef.current) return;

      if (timestamp - lastTimeRef.current > 33) {
        lastTimeRef.current = timestamp;
        const result = landmarkerRef.current.detectForVideo(videoRef.current, timestamp);

        if (result.faceBlendshapes?.[0]?.categories) {
          const bs  = result.faceBlendshapes[0].categories;
          const get = (name: string) => bs.find(c => c.categoryName === name)?.score ?? 0;

          let headTilt = 0;
          if (result.facialTransformationMatrixes?.[0]?.data) {
            const m = result.facialTransformationMatrixes[0].data;
            headTilt = Math.atan2(m[1], m[0]) * 0.5;
          }

          let eyeGazeX = 0, eyeGazeY = 0;
          if (result.faceLandmarks?.[0]?.length >= 478) {
            const lmk = result.faceLandmarks[0];
            const li  = lmk[468];
            const lo  = lmk[33];
            const lin = lmk[133];
            const eyeW = Math.abs(lo.x - lin.x);
            if (eyeW > 0) {
              eyeGazeX = (li.x - (lo.x + lin.x) / 2) / eyeW * 3;
              eyeGazeY = (li.y - (lo.y + lin.y) / 2) / eyeW * 3;
            }
          }

          const raw: FaceTrackingData = {
            blinkLeft:  get('eyeBlinkLeft'),
            blinkRight: get('eyeBlinkRight'),
            mouthOpen:  get('jawOpen'),
            headTilt,
            eyeGazeX,
            eyeGazeY,
            smile:      (get('mouthSmileLeft') + get('mouthSmileRight')) / 2,
            browRaise:  (get('browOuterUpLeft') + get('browOuterUpRight')) / 2,
            browFurrow: (get('browDownLeft') + get('browDownRight')) / 2,
          };

          const s = smoothRef.current;
          const α = 0.35;
          for (const k of Object.keys(raw) as (keyof FaceTrackingData)[]) {
            s[k] = s[k] * (1 - α) + raw[k] * α;
          }
          setData({ ...s });
        }
      }
      rafRef.current = requestAnimationFrame(detect);
    };
    rafRef.current = requestAnimationFrame(detect);
  }, [cleanup]);

  const stop = useCallback(() => {
    cleanup();
    setIsActive(false);
    setIsLoading(false);
    setData(null);
    setVideoEl(null);
  }, [cleanup]);

  useEffect(() => () => cleanup(), [cleanup]);

  return { isActive, isLoading, error, data, videoEl, start, stop };
}
