import { createWorker } from 'tesseract.js';
import { DocumentChunk } from '@/types/file';
import { generateId } from '@/lib/utils';

export async function parseImageOCR(
  fileId: string,
  fileName: string,
  imageBlob: Blob,
  onProgress?: (progress: number) => void
): Promise<{ text: string; chunks: DocumentChunk[] }> {
  try {
    const worker = await createWorker('eng');
    
    // Convert blob to object URL for tesseract
    const imageUrl = URL.createObjectURL(imageBlob);
    
    const ret = await worker.recognize(imageUrl);
    URL.revokeObjectURL(imageUrl);
    await worker.terminate();

    const text = ret.data.text.trim();
    const chunks: DocumentChunk[] = [];

    if (text.length > 0) {
      chunks.push({
        id: generateId(),
        fileId,
        fileName,
        chunkIndex: 0,
        text: `OCR Extracted text from image ${fileName}:\n${text}`,
        sectionTitle: 'OCR Text',
        metadata: {
          confidence: ret.data.confidence,
        },
      });
    }

    return { text, chunks };
  } catch (error) {
    console.error('OCR parsing failed:', error);
    return {
      text: '',
      chunks: [
        {
          id: generateId(),
          fileId,
          fileName,
          chunkIndex: 0,
          text: `[Image file ${fileName}: OCR could not extract text]`,
          sectionTitle: 'Image',
        },
      ],
    };
  }
}
