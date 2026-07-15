import imageCompression from 'browser-image-compression';

export interface ImageCompressionOptions {
  maxSizeMB?: number;
  maxWidthOrHeight?: number;
  useWebWorker?: boolean;
}

/**
 * Comprime uma imagem no navegador (client-side) antes do envio (Server Actions).
 * Otimizado para fotos de perfil e serviços: 500KB (0.5MB), 800px, WebWorker ativo.
 */
export async function compressImageClient(
  file: File,
  customOptions?: ImageCompressionOptions
): Promise<File> {
  // Se não for imagem ou o arquivo for extremamente pequeno (< 100KB), retorna original
  if (!file.type.startsWith('image/') || file.size < 100 * 1024) {
    return file;
  }

  const options = {
    maxSizeMB: customOptions?.maxSizeMB ?? 0.5,
    maxWidthOrHeight: customOptions?.maxWidthOrHeight ?? 800,
    useWebWorker: customOptions?.useWebWorker ?? true,
    fileType: file.type || 'image/jpeg',
  };

  try {
    const compressed = await imageCompression(file, options);

    if (compressed instanceof File) {
      return compressed;
    }

    const blob = compressed as Blob;
    return new File([blob], file.name, {
      type: blob.type || file.type,
      lastModified: Date.now(),
    });
  } catch (error) {
    console.warn('Falha na compressão client-side. Usando arquivo original:', error);
    return file;
  }
}
