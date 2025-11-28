import axios, { AxiosInstance } from 'axios';
import FormData from 'form-data';

export interface EmbeddingResponse {
  embedding: number[];
  error?: string;
}

export class EmbeddingService {
  private static instance: EmbeddingService;
  private client: AxiosInstance;
  private embeddingServiceUrl: string;

  private constructor() {
    this.embeddingServiceUrl = process.env.EMBEDDING_SERVICE_URL || 'http://127.0.0.1:1301';
    this.client = axios.create({
      baseURL: this.embeddingServiceUrl,
      timeout: 30000,
    });
  }

  public static getInstance(): EmbeddingService {
    if (!this.instance) {
      this.instance = new EmbeddingService();
    }
    return this.instance;
  }

  /**
   * Get embedding for an image file
   * @param _filePath Path to the image file
   * @returns Float32Array embedding
   */
  public async getEmbedding(_filePath: string): Promise<Float32Array> {
    try {
      const formData = new FormData();
      this.readFile(_filePath);

      const response = await this.client.post<EmbeddingResponse>('/embed', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.error) {
        throw new Error(`Embedding service error: ${response.data.error}`);
      }

      return new Float32Array(response.data.embedding);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get embedding: ${message}`);
    }
  }

  /**
   * Get embedding from base64 encoded image
   * @param base64Data Base64 encoded image data
   * @returns Float32Array embedding
   */
  public async getEmbeddingFromBase64(base64Data: string): Promise<Float32Array> {
    try {
      // If the input includes a data URL prefix, strip it
      const cleaned = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const buffer = Buffer.from(cleaned, 'base64');

      const form = new FormData();
      // Append buffer as file field expected by the embedding FastAPI
      form.append('file', buffer, {
        filename: 'upload.jpg',
        contentType: 'image/jpeg',
      });

      const headers = form.getHeaders();

      const response = await this.client.post<EmbeddingResponse>('/embed', form, {
        headers: {
          ...headers,
        },
        maxBodyLength: Infinity,
      });

      if (response.data.error) {
        throw new Error(`Embedding service error: ${response.data.error}`);
      }

      return new Float32Array(response.data.embedding);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get embedding: ${message}`);
    }
  }

  /**
   * Health check for embedding service
   */
  public async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }

  private readFile(_filePath: string): void {
    // This is a placeholder - in Node.js you would use fs module
    // For now, we'll throw an error prompting to use base64
    throw new Error('Use getEmbeddingFromBase64 method instead for Node.js environment');
  }
}

export const embeddingService = EmbeddingService.getInstance();
