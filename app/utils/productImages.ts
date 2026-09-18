import { api } from "@/utils/api";

export type ProductImage = { imageUrl: string; publicId?: string };

const uploadImage = async (file: File): Promise<ProductImage> => {
  const formData = new FormData();
  formData.append("image", file);
  const { image } = await api.post<{ image: { url: string; publicId: string } }>("/admin/general/upload-image", formData);
  return { imageUrl: image.url, publicId: image.publicId };
};

export const deleteImages = (publicIds: Array<string | undefined>) =>
  Promise.allSettled(
    publicIds.filter(Boolean).map((publicId) => api.delete("/admin/general/delete-image", { publicId }))
  );

/**
 * All or nothing: if any file fails, the ones that did upload are removed again.
 * Promise.all would reject on the first failure and leave the rest orphaned in
 * Cloudinary, paid for and referenced by nothing.
 */
export const uploadAll = async (files: File[]): Promise<ProductImage[]> => {
  const results = await Promise.allSettled(files.map(uploadImage));
  const uploaded = results.flatMap((r) => (r.status === "fulfilled" ? [r.value] : []));
  const failed = results.find((r) => r.status === "rejected");
  if (failed) {
    deleteImages(uploaded.map((img) => img.publicId));
    throw (failed as PromiseRejectedResult).reason;
  }
  return uploaded;
};
