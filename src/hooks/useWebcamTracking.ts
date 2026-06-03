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

export function useWebcamTracking() {
  const [isActive, setIsActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FaceTrackingData | null>(null);
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const streamRef    = useRef<MediaStream | null>(null);
  const videoRef     = useRef<HTMLVideoElement | null>(null);
  const rafRef       = useRef<number>(0);
  const lastTimeRef  = useRef(0);
  const smoothRef    = useRef<FaceTrackingData>({ blinkLeft: 0, blinkRight: 0, mouthOpen: 0, headTilt: 0, eyeGazeX: 0, eyeGazeY: 0, smile: 0, browRaise: 0, browFurrow: 0 });

  const start = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const vision = await FilesetResolver.forVisionTasks(WASM_CDN);
      const lm = await FaceLandmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate: 'GPU' },
        outputFaceBlendshapes: true,
        outputFacialTransformationMatrixes: true,
        runningMode: 'VIDEO',
        numFaces: 1,
      });
      landmarkerRef.current = lm;

      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' }, audio: false });
      streamRef.current = stream;

      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;
      video.muted = true;
      video.playsInline = true;
      await new Promise<void>(res => { video.onloadeddata = () => res(); });
      videoRef.current = video;
      setVideoEl(video);
      setIsActive(true);
      setIsLoading(false);

      const detect = (timestamp: number) => {
        if (!landmarkerRef.current || !videoRef.current) return;
        if (timestamp - lastTimeRef.current > 33) { // ~30 fps
          lastTimeRef.current = timestamp;
          const result = landmarkerRef.current.detectForVideo(videoRef.current, timestamp);

          if (result.faceBlendshapes?.[0]?.categories) {
            const bs = result.faceBlendshapes[0].categories;
            const get = (name: string) => bs.find(c => c.categoryName === name)?.score ?? 0;

            // Head tilt from transformation matrix
            let headTilt = 0;
            if (result.facialTransformationMatrixes?.[0]?.data) {
              const m = result.facialTransformationMatrixes[0].data;
              // Column-major 4×4: roll ≈ atan2(m[1], m[0])
              headTilt = Math.atan2(m[1], m[0]) * 0.5; // dampen
            }

            // Eye gaze from iris landmarks if available
            let eyeGazeX = 0, eyeGazeY = 0;
            if (result.faceLandmarks?.[0] && result.faceLandmarks[0].length >= 478) {
              const lm = result.faceLandmarks[0];
              // Left iris center: 468, left eye corners: 33 (outer), 133 (inner)
              const li = lm[468];
              const lo = lm[33];
              const lin = lm[133];
              const leftCenterX = (lo.x + lin.x) / 2;
              const leftCenterY = (lo.y + lin.y) / 2;
              const eyeWidth = Math.abs(lo.x - lin.x);
              eyeGazeX = eyeWidth > 0 ? (li.x - leftCenterX) / eyeWidth * 3 : 0;
              eyeGazeY = eyeWidth > 0 ? (li.y - leftCenterY) / eyeWidth * 3 : 0;
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

            // Smooth all values
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
    } catch (e) {
      const name = e instanceof DOMException ? e.name : '';
      if (name === 'NotReadableError' || name === 'TrackStartError') {
        setError('Camera is in use by another app (Zoom, OBS, Teams…). Close it and try again.');
      } else if (name === 'NotAllowedError') {
        setError('Camera permission denied. Allow camera access in your browser settings.');
      } else if (name === 'NotFoundError') {
        setError('No camera found. Plug in a webcam and try again.');
      } else {
        setError(e instanceof Error ? e.message : 'Webcam unavailable');
      }
      setIsLoading(false);
    }
  }, []);

  const stop = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    void landmarkerRef.current?.close();
    landmarkerRef.current = null;
    videoRef.current = null;
    streamRef.current = null;
    setIsActive(false);
    setIsLoading(false);
    setData(null);
    setVideoEl(null);
  }, []);

  useEffect(() => () => stop(), [stop]);

  return { isActive, isLoading, error, data, videoEl, start, stop };
}
