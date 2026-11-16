/**
 * Shrinks a picture from the camera or gallery to a small square JPEG, as
 * text ("data:image/jpeg;base64,..."), about 10-15 KB. Stored inside the
 * photo record; no file storage service is used (see the brief, section 4).
 */
export const PHOTO_SIZE = 160;

export async function shrinkPhoto(file: Blob): Promise<string> {
  const image = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const side = Math.min(image.width, image.height);
  const canvas = document.createElement('canvas');
  canvas.width = PHOTO_SIZE;
  canvas.height = PHOTO_SIZE;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('no-canvas');
  // The middle square of the picture.
  ctx.drawImage(image, (image.width - side) / 2, (image.height - side) / 2, side, side, 0, 0, PHOTO_SIZE, PHOTO_SIZE);
  image.close();
  return canvas.toDataURL('image/jpeg', 0.72);
}
