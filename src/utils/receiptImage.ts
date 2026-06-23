const RECEIPT_MAX_DIMENSION = 1600;
const RECEIPT_TARGET_BYTES = 1.2 * 1024 * 1024;
const RECEIPT_OUTPUT_TYPE = 'image/jpeg';
const RECEIPT_QUALITIES = [0.82, 0.74, 0.66, 0.58];

const imageCache = new Set<string>();

const loadImage = (file: File) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Cannot load receipt image.'));
    };
    image.src = url;
  });

const canvasToBlob = (canvas: HTMLCanvasElement, quality: number) =>
  new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error('Cannot optimize receipt image.')),
      RECEIPT_OUTPUT_TYPE,
      quality,
    );
  });

const receiptFileName = (fileName: string) => {
  const baseName = fileName.replace(/\.[^.]+$/, '') || 'receipt';
  return `${baseName}-optimized.jpg`;
};

export const optimizeReceiptImage = async (file: File) => {
  if (!file.type.startsWith('image/')) return file;

  const image = await loadImage(file);
  const largestSide = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = largestSide > RECEIPT_MAX_DIMENSION ? RECEIPT_MAX_DIMENSION / largestSide : 1;

  if (scale === 1 && file.size <= RECEIPT_TARGET_BYTES && file.type === RECEIPT_OUTPUT_TYPE) {
    return file;
  }

  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
  const context = canvas.getContext('2d', { alpha: false });
  if (!context) return file;

  context.fillStyle = '#fff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  let bestBlob: Blob | null = null;
  for (const quality of RECEIPT_QUALITIES) {
    const blob = await canvasToBlob(canvas, quality);
    bestBlob = blob;
    if (blob.size <= RECEIPT_TARGET_BYTES) break;
  }

  if (!bestBlob || bestBlob.size >= file.size) return file;
  return new File([bestBlob], receiptFileName(file.name), {
    type: RECEIPT_OUTPUT_TYPE,
    lastModified: Date.now(),
  });
};

export const preloadReceiptImage = (url?: string | null) => {
  if (!url || imageCache.has(url)) return;
  imageCache.add(url);
  const image = new Image();
  image.decoding = 'async';
  image.src = url;
};
