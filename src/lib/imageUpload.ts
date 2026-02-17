'use client';

import { getMyToken } from './firebaseAuth';

export interface UploadedImageResult {
  url: string;
  public_id: string;
}

type FirebaseUserLike = {
  getIdToken: () => Promise<string>;
};

function getUploadEndpoint(): string {
  const explicit = process.env.NEXT_PUBLIC_IMAGE_UPLOAD_URL;
  if (explicit && /^https?:\/\//i.test(explicit)) return explicit.replace(/\/$/, '');

  const apiBase =
    process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
  if (!apiBase) throw new Error('Falta NEXT_PUBLIC_API_URL');

  const base = apiBase.replace(/\/$/, '');
  if (/\/api$/i.test(base)) return `${base}/uploads/image`;
  return `${base}/api/uploads/image`;
}

export async function uploadImage(
  file: File,
  firebaseUser?: FirebaseUserLike | null,
): Promise<UploadedImageResult> {
  const token = firebaseUser ? await firebaseUser.getIdToken() : await getMyToken();
  const form = new FormData();
  form.append('image', file, file.name);

  const endpoint = getUploadEndpoint();
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: form,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `Error ${res.status}: ${res.statusText}`);
  }

  return res.json();
}

export async function uploadImageFile(file: File): Promise<UploadedImageResult> {
  return uploadImage(file);
}

export async function uploadImageFiles(files: File[]): Promise<UploadedImageResult[]> {
  if (!files || files.length === 0) return [];
  return Promise.all(files.map((f) => uploadImageFile(f)));
}
