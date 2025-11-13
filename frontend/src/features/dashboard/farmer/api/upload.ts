const UPLOAD_API_BASE = process.env.NEXT_PUBLIC_UPLOAD_API_BASE || "http://localhost:4000/api/upload";

export type UploadedFile = {
  id: string;
  filename: string;
  originalName: string;
  mimetype: string;
  size: number;
  url: string;
};

export const uploadApi = {
  uploadFile: async (file: File): Promise<UploadedFile> => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${UPLOAD_API_BASE}`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "ファイルのアップロードに失敗しました");
    }

    const data = await response.json();
    return data.file;
  },

  uploadMultipleFiles: async (files: File[]): Promise<UploadedFile[]> => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file);
    });

    const response = await fetch(`${UPLOAD_API_BASE}/multiple`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: "Upload failed" }));
      throw new Error(error.message || "ファイルのアップロードに失敗しました");
    }

    const data = await response.json();
    return data.files;
  },
};

