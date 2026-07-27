import descriptorData from "@/data/face-descriptors.json";

export interface FaceDescriptorData {
  model: string;
  generatedAt: string;
  descriptors: number[][];
}

const data = descriptorData as FaceDescriptorData;

export function getFaceDescriptors(): FaceDescriptorData {
  return data;
}
