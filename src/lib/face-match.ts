import type * as FaceApi from "@vladmandic/face-api";
import { getFaceDescriptors } from "./face-config";

// Distance→score breakpoints, tuned for face-api 128-d euclidean distances
// (same person typically 0.3–0.5, strangers 0.6–0.9).
export const PERFECT_MAX_DISTANCE = 0.45;
export const NEAR_MATCH_MAX_DISTANCE = 0.6;
export const STRANGER_MAX_DISTANCE = 0.9;

export type RateOutcome =
  | { kind: "score"; score: number; distance: number; faceCount: number }
  | { kind: "noface" }
  | { kind: "uncalibrated" };

let faceApiPromise: Promise<typeof FaceApi> | null = null;
let modelsPromise: Promise<typeof FaceApi> | null = null;

function getFaceApi(): Promise<typeof FaceApi> {
  if (!faceApiPromise) {
    faceApiPromise = import("@vladmandic/face-api");
  }
  return faceApiPromise;
}

export function loadModels(): Promise<typeof FaceApi> {
  if (!modelsPromise) {
    modelsPromise = (async () => {
      const faceapi = await getFaceApi();
      // tf.ready() exists in the bundled runtime but the package's typings
      // only declare a subset of the tf namespace.
      await (faceapi.tf as unknown as { ready(): Promise<void> }).ready();
      await Promise.all([
        faceapi.nets.ssdMobilenetv1.loadFromUri("/models"),
        faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
        faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
      ]);
      return faceapi;
    })();
    // Allow a retry if the network fails mid-load.
    modelsPromise.catch(() => {
      modelsPromise = null;
    });
  }
  return modelsPromise;
}

export function euclideanDistance(a: ArrayLike<number>, b: ArrayLike<number>): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return Math.sqrt(sum);
}

export function scoreFromDistance(distance: number): number {
  if (distance <= PERFECT_MAX_DISTANCE) return 10;
  if (distance <= NEAR_MATCH_MAX_DISTANCE) {
    const t =
      (distance - PERFECT_MAX_DISTANCE) /
      (NEAR_MATCH_MAX_DISTANCE - PERFECT_MAX_DISTANCE);
    return Math.round(10 - t * 2); // 10 → 8
  }
  if (distance < STRANGER_MAX_DISTANCE) {
    const t =
      (distance - NEAR_MATCH_MAX_DISTANCE) /
      (STRANGER_MAX_DISTANCE - NEAR_MATCH_MAX_DISTANCE);
    return Math.max(1, Math.round(7 - t * 6)); // 7 → 1
  }
  return 1;
}

export async function describeFaces(
  input: HTMLImageElement | HTMLCanvasElement
): Promise<Float32Array[]> {
  const faceapi = await loadModels();
  const detections = await faceapi
    .detectAllFaces(input)
    .withFaceLandmarks()
    .withFaceDescriptors();
  return detections.map((d) => d.descriptor);
}

export async function ratePhoto(
  input: HTMLImageElement | HTMLCanvasElement
): Promise<RateOutcome> {
  const references = getFaceDescriptors().descriptors;
  if (references.length === 0) return { kind: "uncalibrated" };

  const faces = await describeFaces(input);
  if (faces.length === 0) return { kind: "noface" };

  // Nearest neighbor across all faces × all references: a group photo
  // containing the reference person still scores as her.
  let best = Infinity;
  for (const face of faces) {
    for (const ref of references) {
      const distance = euclideanDistance(face, ref);
      if (distance < best) best = distance;
    }
  }

  return {
    kind: "score",
    score: scoreFromDistance(best),
    distance: best,
    faceCount: faces.length,
  };
}
