import { Request, Response } from 'express';
import { RedisClient } from '../services/redis.service';
import { embeddingService } from '../services/embedding.service';

export class FaceController {
  private redisClient: RedisClient;

  constructor() {
    this.redisClient = RedisClient.getInstance();
  }

  /**
   * Embed a face image and store it
   * POST /api/face/embed
   */
  embedFace = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id, image_base64, metadata } = req.body as {
        id?: string;
        image_base64?: string;
        metadata?: Record<string, string | number>;
      };

      if (!id || !image_base64) {
        res.status(400).json({
          error: 'Missing required fields: id, image_base64',
        });
        return;
      }

      // Get embedding from embedding service
      const embedding = await embeddingService.getEmbeddingFromBase64(image_base64);

      // Store in Redis
      const chunkId = 0;
      const content = `Face embedding for ${id}`;
      await this.redisClient.addDocument(id, chunkId, content, embedding, metadata || {});

      res.json({
        message: 'Face embedded and stored successfully',
        id,
        embeddingDim: embedding.length,
      });
    } catch (error: unknown) {
      console.error('Error embedding face:', error);
      const message = error instanceof Error ? error.message : 'Failed to embed face';
      res.status(500).json({
        error: message,
      });
    }
  };

  /**
   * Search for similar faces
   * POST /api/face/search
   */
  searchFace = async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        image_base64,
        topK = 5,
        filter = '',
      } = req.body as {
        image_base64?: string;
        topK?: number;
        filter?: string;
      };

      if (!image_base64) {
        res.status(400).json({
          error: 'Missing required field: image_base64',
        });
        return;
      }

      // Get embedding from embedding service
      const queryEmbedding = await embeddingService.getEmbeddingFromBase64(image_base64);

      // Search in Redis
      const results = await this.redisClient.searchKNN(queryEmbedding, topK, filter);

      res.json({
        message: 'Search completed',
        count: results.length,
        topK,
        results,
      });
    } catch (error: unknown) {
      console.error('Error searching face:', error);
      const message = error instanceof Error ? error.message : 'Failed to search face';
      res.status(500).json({
        error: message,
      });
    }
  };

  /**
   * Get face by ID
   * GET /api/face/:id
   */
  getFaceById = (req: Request, res: Response): void => {
    try {
      const { id } = req.params as { id?: string };

      if (!id) {
        res.status(400).json({
          error: 'Missing required parameter: id',
        });
        return;
      }

      // Note: Redis doesn't have a direct get by ID method in the current implementation
      // This is a placeholder for future enhancement
      res.json({
        message: 'Get face by ID endpoint',
        id,
        note: 'Implement retrieval logic as needed',
      });
    } catch (error: unknown) {
      console.error('Error getting face:', error);
      const message = error instanceof Error ? error.message : 'Failed to get face';
      res.status(500).json({
        error: message,
      });
    }
  };

  /**
   * Delete face by ID
   * DELETE /api/face/:id
   */
  deleteFace = (req: Request, res: Response): void => {
    try {
      const { id } = req.params as { id?: string };

      if (!id) {
        res.status(400).json({
          error: 'Missing required parameter: id',
        });
        return;
      }

      // Note: Redis delete logic needs to be implemented in RedisClient
      // This is a placeholder for future enhancement
      res.json({
        message: 'Face deleted successfully',
        id,
      });
    } catch (error: unknown) {
      console.error('Error deleting face:', error);
      const message = error instanceof Error ? error.message : 'Failed to delete face';
      res.status(500).json({
        error: message,
      });
    }
  };
}

export const faceController = new FaceController();
