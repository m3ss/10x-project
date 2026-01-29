import { describe, it, expect, vi, beforeEach } from 'vitest';
import { FlashcardService } from '@/lib/flashcard.service';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/db/database.types';
import type { FlashcardCreateDto, FlashcardDto, FlashcardUpdateDto } from '@/types';

/**
 * FlashcardService Unit Tests
 * 
 * Testing strategy:
 * - Mock Supabase client and database operations
 * - Test all CRUD operations (Create, Read, Update, Delete)
 * - Test validation logic
 * - Test error handling
 * - Test edge cases
 */

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
} as unknown as SupabaseClient<Database>;

describe('FlashcardService', () => {
  let service: FlashcardService;
  const mockUserId = 'user-123';

  beforeEach(() => {
    // Reset all mocks before each test
    vi.clearAllMocks();
    
    // Initialize service
    service = new FlashcardService(mockSupabase);
  });

  // ========================================
  // Constructor
  // ========================================
  describe('constructor', () => {
    it('should initialize service with Supabase client', () => {
      // Arrange & Act
      const newService = new FlashcardService(mockSupabase);

      // Assert
      expect(newService).toBeInstanceOf(FlashcardService);
    });
  });

  // ========================================
  // createFlashcards
  // ========================================
  describe('createFlashcards', () => {
    describe('when operation succeeds', () => {
      it('should create single flashcard with correct data', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question 1',
            back: 'Answer 1',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question 1',
            back: 'Answer 1',
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
        expect(mockFrom.insert).toHaveBeenCalledWith([
          {
            front: 'Question 1',
            back: 'Answer 1',
            source: 'manual',
            generation_id: null,
            user_id: mockUserId,
          },
        ]);
        expect(result).toEqual(mockCreatedFlashcards);
      });

      it('should create multiple flashcards', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question 1',
            back: 'Answer 1',
            source: 'ai-full',
            generation_id: 10,
          },
          {
            front: 'Question 2',
            back: 'Answer 2',
            source: 'ai-full',
            generation_id: 10,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question 1',
            back: 'Answer 1',
            source: 'ai-full',
            generation_id: 10,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
          {
            id: 2,
            front: 'Question 2',
            back: 'Answer 2',
            source: 'ai-full',
            generation_id: 10,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result).toHaveLength(2);
        expect(result).toEqual(mockCreatedFlashcards);
      });

      it('should trim whitespace from front and back', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: '  Question with spaces  ',
            back: '  Answer with spaces  ',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question with spaces',
            back: 'Answer with spaces',
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(mockFrom.insert).toHaveBeenCalledWith([
          {
            front: 'Question with spaces',
            back: 'Answer with spaces',
            source: 'manual',
            generation_id: null,
            user_id: mockUserId,
          },
        ]);
      });

      it('should create flashcard with source "ai-full" and generation_id', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'AI Question',
            back: 'AI Answer',
            source: 'ai-full',
            generation_id: 5,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'AI Question',
            back: 'AI Answer',
            source: 'ai-full',
            generation_id: 5,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result[0].source).toBe('ai-full');
        expect(result[0].generation_id).toBe(5);
      });

      it('should create flashcard with source "ai-edited" and generation_id', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Edited Question',
            back: 'Edited Answer',
            source: 'ai-edited',
            generation_id: 7,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Edited Question',
            back: 'Edited Answer',
            source: 'ai-edited',
            generation_id: 7,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result[0].source).toBe('ai-edited');
        expect(result[0].generation_id).toBe(7);
      });
    });

    describe('when validation fails', () => {
      it('should throw error when flashcards array is empty', async () => {
        // Arrange
        const emptyFlashcards: FlashcardCreateDto[] = [];

        // Act & Assert
        await expect(service.createFlashcards(emptyFlashcards, mockUserId)).rejects.toThrow(
          'At least one flashcard is required'
        );
      });

      it('should throw error when front is empty', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: '',
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard front cannot be empty'
        );
      });

      it('should throw error when front is only whitespace', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: '   ',
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard front cannot be empty'
        );
      });

      it('should throw error when back is empty', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: '',
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard back cannot be empty'
        );
      });

      it('should throw error when back is only whitespace', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: '   ',
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard back cannot be empty'
        );
      });

      it('should throw error when front exceeds 200 characters', async () => {
        // Arrange
        const longFront = 'a'.repeat(201);
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: longFront,
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard front cannot exceed 200 characters'
        );
      });

      it('should throw error when back exceeds 500 characters', async () => {
        // Arrange
        const longBack = 'a'.repeat(501);
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: longBack,
            source: 'manual',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Flashcard back cannot exceed 500 characters'
        );
      });

      it('should throw error for invalid source value', async () => {
        // Arrange
        const mockFlashcards = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'invalid-source' as any,
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Invalid source value'
        );
      });

      it('should throw error when source is "ai-full" without generation_id', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'ai-full',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'generation_id is required for AI-generated flashcards'
        );
      });

      it('should throw error when source is "ai-edited" without generation_id', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'ai-edited',
            generation_id: null,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'generation_id is required for AI-generated flashcards'
        );
      });

      it('should throw error when source is "manual" with generation_id', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'manual',
            generation_id: 5,
          },
        ];

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'generation_id must be null for manual flashcards'
        );
      });
    });

    describe('when database operation fails', () => {
      it('should throw error on database error', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockError = { message: 'Database connection failed', code: 'DB_ERROR' };
        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'Failed to create flashcards: Database connection failed'
        );
      });

      it('should throw error when database returns no data', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: [], error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act & Assert
        await expect(service.createFlashcards(mockFlashcards, mockUserId)).rejects.toThrow(
          'No flashcards were created'
        );
      });
    });

    describe('edge cases', () => {
      it('should accept front with exactly 200 characters', async () => {
        // Arrange
        const front200 = 'a'.repeat(200);
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: front200,
            back: 'Answer',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: front200,
            back: 'Answer',
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result[0].front).toHaveLength(200);
      });

      it('should accept back with exactly 500 characters', async () => {
        // Arrange
        const back500 = 'a'.repeat(500);
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question',
            back: back500,
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question',
            back: back500,
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result[0].back).toHaveLength(500);
      });

      it('should handle text with emoji and special characters', async () => {
        // Arrange
        const mockFlashcards: FlashcardCreateDto[] = [
          {
            front: 'Question with emoji 🎉 and special chars: @#$%',
            back: 'Answer with emoji 🚀 and Polish: ąćęłńóśźż',
            source: 'manual',
            generation_id: null,
          },
        ];

        const mockCreatedFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question with emoji 🎉 and special chars: @#$%',
            back: 'Answer with emoji 🚀 and Polish: ąćęłńóśźż',
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockFrom = {
          insert: vi.fn().mockReturnThis(),
          select: vi.fn().mockResolvedValue({ data: mockCreatedFlashcards, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockFrom);

        // Act
        const result = await service.createFlashcards(mockFlashcards, mockUserId);

        // Assert
        expect(result[0].front).toContain('🎉');
        expect(result[0].back).toContain('ąćęłńóśźż');
      });
    });
  });

  // ========================================
  // getFlashcards
  // ========================================
  describe('getFlashcards', () => {
    describe('when operation succeeds', () => {
      it('should fetch flashcards with default parameters', async () => {
        // Arrange
        const mockFlashcards: FlashcardDto[] = [
          {
            id: 1,
            front: 'Question 1',
            back: 'Answer 1',
            source: 'manual',
            generation_id: null,
            created_at: '2024-01-15T12:00:00Z',
            updated_at: '2024-01-15T12:00:00Z',
          },
        ];

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null, count: 1 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcards(mockUserId);

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
        expect(mockQuery.range).toHaveBeenCalledWith(0, 19); // page 1, limit 20
        expect(result.data).toEqual(mockFlashcards);
        expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1 });
      });

      it('should apply pagination correctly', async () => {
        // Arrange
        const mockFlashcards: FlashcardDto[] = [];
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null, count: 50 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act - page 2, limit 10
        await service.getFlashcards(mockUserId, 2, 10);

        // Assert
        expect(mockQuery.range).toHaveBeenCalledWith(10, 19); // (2-1)*10 = 10, 10+10-1 = 19
      });

      it('should sort by created_at descending (default)', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 20, 'created_at', 'desc');

        // Assert
        expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false });
      });

      it('should sort by updated_at ascending', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 20, 'updated_at', 'asc');

        // Assert
        expect(mockQuery.order).toHaveBeenCalledWith('updated_at', { ascending: true });
      });

      it('should sort by front', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 20, 'front', 'asc');

        // Assert
        expect(mockQuery.order).toHaveBeenCalledWith('front', { ascending: true });
      });

      it('should filter by source "ai-full"', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 20, 'created_at', 'desc', 'ai-full');

        // Assert
        expect(mockQuery.eq).toHaveBeenCalledWith('source', 'ai-full');
      });

      it('should return empty array when no flashcards', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcards(mockUserId);

        // Assert
        expect(result.data).toEqual([]);
        expect(result.pagination.total).toBe(0);
      });

      it('should return correct pagination data', async () => {
        // Arrange
        const mockFlashcards: FlashcardDto[] = Array(5).fill({}).map((_, i) => ({
          id: i + 1,
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
          source: 'manual' as const,
          generation_id: null,
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
        }));

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null, count: 42 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcards(mockUserId, 3, 5);

        // Assert
        expect(result.pagination).toEqual({
          page: 3,
          limit: 5,
          total: 42,
        });
      });
    });

    describe('when validation fails', () => {
      it('should throw error when page < 1', async () => {
        // Act & Assert
        await expect(service.getFlashcards(mockUserId, 0, 20)).rejects.toThrow(
          'Page number must be at least 1'
        );
      });

      it('should throw error when limit < 1', async () => {
        // Act & Assert
        await expect(service.getFlashcards(mockUserId, 1, 0)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });

      it('should throw error when limit > 100', async () => {
        // Act & Assert
        await expect(service.getFlashcards(mockUserId, 1, 101)).rejects.toThrow(
          'Limit must be between 1 and 100'
        );
      });
    });

    describe('when database operation fails', () => {
      it('should throw error on database error', async () => {
        // Arrange
        const mockError = { message: 'Database error', code: 'DB_ERROR' };
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: null, error: mockError, count: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.getFlashcards(mockUserId)).rejects.toThrow(
          'Failed to retrieve flashcards: Database error'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle last page with partial results', async () => {
        // Arrange
        const mockFlashcards: FlashcardDto[] = Array(3).fill({}).map((_, i) => ({
          id: i + 1,
          front: `Question ${i + 1}`,
          back: `Answer ${i + 1}`,
          source: 'manual' as const,
          generation_id: null,
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
        }));

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: mockFlashcards, error: null, count: 23 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcards(mockUserId, 3, 10);

        // Assert
        expect(result.data).toHaveLength(3); // Only 3 items on last page
        expect(result.pagination.total).toBe(23);
      });

      it('should accept limit = 1 (minimum)', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 1);

        // Assert
        expect(mockQuery.range).toHaveBeenCalledWith(0, 0);
      });

      it('should accept limit = 100 (maximum)', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          order: vi.fn().mockReturnThis(),
          range: vi.fn().mockResolvedValue({ data: [], error: null, count: 0 }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.getFlashcards(mockUserId, 1, 100);

        // Assert
        expect(mockQuery.range).toHaveBeenCalledWith(0, 99);
      });
    });
  });

  // ========================================
  // getFlashcard
  // ========================================
  describe('getFlashcard', () => {
    describe('when operation succeeds', () => {
      it('should fetch flashcard by ID for authorized user', async () => {
        // Arrange
        const mockFlashcard: FlashcardDto = {
          id: 1,
          front: 'Question 1',
          back: 'Answer 1',
          source: 'manual',
          generation_id: null,
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockFlashcard, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcard(1, mockUserId);

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
        expect(mockQuery.eq).toHaveBeenCalledWith('id', 1);
        expect(mockQuery.eq).toHaveBeenCalledWith('user_id', mockUserId);
        expect(result).toEqual(mockFlashcard);
      });

      it('should return all flashcard fields', async () => {
        // Arrange
        const mockFlashcard: FlashcardDto = {
          id: 5,
          front: 'Test Question',
          back: 'Test Answer',
          source: 'ai-full',
          generation_id: 10,
          created_at: '2024-01-15T12:00:00Z',
          updated_at: '2024-01-15T12:00:00Z',
        };

        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockFlashcard, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        const result = await service.getFlashcard(5, mockUserId);

        // Assert
        expect(result).toHaveProperty('id');
        expect(result).toHaveProperty('front');
        expect(result).toHaveProperty('back');
        expect(result).toHaveProperty('source');
        expect(result).toHaveProperty('generation_id');
        expect(result).toHaveProperty('created_at');
        expect(result).toHaveProperty('updated_at');
      });
    });

    describe('when operation fails', () => {
      it('should throw "Flashcard not found" for non-existent flashcard (PGRST116)', async () => {
        // Arrange
        const mockError = { code: 'PGRST116', message: 'No rows returned' };
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.getFlashcard(999, mockUserId)).rejects.toThrow('Flashcard not found');
      });

      it('should throw error on database error', async () => {
        // Arrange
        const mockError = { code: 'DB_ERROR', message: 'Database connection failed' };
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.getFlashcard(1, mockUserId)).rejects.toThrow(
          'Failed to retrieve flashcard: Database connection failed'
        );
      });

      it('should throw "Flashcard not found" when data is null', async () => {
        // Arrange
        const mockQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.getFlashcard(1, mockUserId)).rejects.toThrow('Flashcard not found');
      });
    });
  });

  // ========================================
  // updateFlashcard
  // ========================================
  describe('updateFlashcard', () => {
    const mockCurrentFlashcard: FlashcardDto = {
      id: 1,
      front: 'Original Question',
      back: 'Original Answer',
      source: 'ai-full',
      generation_id: 5,
      created_at: '2024-01-15T12:00:00Z',
      updated_at: '2024-01-15T12:00:00Z',
    };

    describe('when operation succeeds', () => {
      it('should update front field', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Updated Question' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          front: 'Updated Question',
          source: 'ai-edited',
        };

        // Mock getFlashcard (called to check current source)
        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        // Mock update
        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.front).toBe('Updated Question');
        expect(mockUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({ front: 'Updated Question' })
        );
      });

      it('should update back field', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { back: 'Updated Answer' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          back: 'Updated Answer',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.back).toBe('Updated Answer');
      });

      it('should update both front and back', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = {
          front: 'Updated Question',
          back: 'Updated Answer',
        };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          front: 'Updated Question',
          back: 'Updated Answer',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.front).toBe('Updated Question');
        expect(result.back).toBe('Updated Answer');
      });

      it('should trim whitespace from updated fields', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = {
          front: '  Updated Question  ',
          back: '  Updated Answer  ',
        };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          front: 'Updated Question',
          back: 'Updated Answer',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(mockUpdateQuery.update).toHaveBeenCalledWith({
          front: 'Updated Question',
          back: 'Updated Answer',
          source: 'ai-edited',
        });
      });

      it('should change source from "ai-full" to "ai-edited" when editing', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Updated Question' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          front: 'Updated Question',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.source).toBe('ai-edited');
        expect(mockUpdateQuery.update).toHaveBeenCalledWith(
          expect.objectContaining({ source: 'ai-edited' })
        );
      });

      it('should preserve source "ai-edited" when re-editing', async () => {
        // Arrange
        const mockAiEditedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          source: 'ai-edited',
        };
        const updates: FlashcardUpdateDto = { front: 'Updated Again' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockAiEditedFlashcard,
          front: 'Updated Again',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockAiEditedFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(mockUpdateQuery.update).toHaveBeenCalledWith({
          front: 'Updated Again',
        });
      });

      it('should preserve source "manual" when editing', async () => {
        // Arrange
        const mockManualFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          source: 'manual',
        };
        const updates: FlashcardUpdateDto = { front: 'Updated Question' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockManualFlashcard,
          front: 'Updated Question',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockManualFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(mockUpdateQuery.update).toHaveBeenCalledWith({
          front: 'Updated Question',
        });
      });

      it('should return current flashcard when no fields to update', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = {};

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn().mockReturnValueOnce(mockGetQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result).toEqual(mockCurrentFlashcard);
        expect(mockSupabase.from).toHaveBeenCalledTimes(1); // Only getFlashcard called
      });
    });

    describe('when validation fails', () => {
      it('should throw error when front is empty', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: '' };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard front cannot be empty'
        );
      });

      it('should throw error when front is only whitespace', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: '   ' };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard front cannot be empty'
        );
      });

      it('should throw error when back is empty', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { back: '' };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard back cannot be empty'
        );
      });

      it('should throw error when back is only whitespace', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { back: '   ' };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard back cannot be empty'
        );
      });

      it('should throw error when front exceeds 200 characters', async () => {
        // Arrange
        const longFront = 'a'.repeat(201);
        const updates: FlashcardUpdateDto = { front: longFront };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard front cannot exceed 200 characters'
        );
      });

      it('should throw error when back exceeds 500 characters', async () => {
        // Arrange
        const longBack = 'a'.repeat(501);
        const updates: FlashcardUpdateDto = { back: longBack };

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard back cannot exceed 500 characters'
        );
      });
    });

    describe('when operation fails', () => {
      it('should throw "Flashcard not found" when flashcard does not exist', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Updated' };
        const mockError = { code: 'PGRST116', message: 'No rows returned' };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };

        mockSupabase.from = vi.fn().mockReturnValueOnce(mockGetQuery);

        // Act & Assert
        await expect(service.updateFlashcard(999, mockUserId, updates)).rejects.toThrow(
          'Flashcard not found'
        );
      });

      it('should throw error on database error during update', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Updated' };
        const mockError = { code: 'DB_ERROR', message: 'Database error' };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: mockError }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Failed to update flashcard: Database error'
        );
      });

      it('should throw "Flashcard not found" when update returns null data', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Updated' };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act & Assert
        await expect(service.updateFlashcard(1, mockUserId, updates)).rejects.toThrow(
          'Flashcard not found'
        );
      });
    });

    describe('edge cases', () => {
      it('should handle updating only front field', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { front: 'Only Front Updated' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          front: 'Only Front Updated',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.front).toBe('Only Front Updated');
        expect(result.back).toBe(mockCurrentFlashcard.back); // Unchanged
      });

      it('should handle updating only back field', async () => {
        // Arrange
        const updates: FlashcardUpdateDto = { back: 'Only Back Updated' };
        const mockUpdatedFlashcard: FlashcardDto = {
          ...mockCurrentFlashcard,
          back: 'Only Back Updated',
          source: 'ai-edited',
        };

        const mockGetQuery = {
          select: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockCurrentFlashcard, error: null }),
        };

        const mockUpdateQuery = {
          update: vi.fn().mockReturnThis(),
          eq: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          single: vi.fn().mockResolvedValue({ data: mockUpdatedFlashcard, error: null }),
        };

        mockSupabase.from = vi.fn()
          .mockReturnValueOnce(mockGetQuery)
          .mockReturnValueOnce(mockUpdateQuery);

        // Act
        const result = await service.updateFlashcard(1, mockUserId, updates);

        // Assert
        expect(result.back).toBe('Only Back Updated');
        expect(result.front).toBe(mockCurrentFlashcard.front); // Unchanged
      });
    });
  });

  // ========================================
  // deleteFlashcard
  // ========================================
  describe('deleteFlashcard', () => {
    describe('when operation succeeds', () => {
      it('should delete flashcard for authorized user', async () => {
        // Arrange
        const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
        const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
        const mockQuery = {
          delete: vi.fn().mockReturnValue({ eq: mockFirstEq }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.deleteFlashcard(1, mockUserId);

        // Assert
        expect(mockSupabase.from).toHaveBeenCalledWith('flashcards');
        expect(mockQuery.delete).toHaveBeenCalled();
        expect(mockFirstEq).toHaveBeenCalledWith('id', 1);
        expect(mockSecondEq).toHaveBeenCalledWith('user_id', mockUserId);
      });

      it('should not throw error when delete succeeds', async () => {
        // Arrange
        const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
        const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
        const mockQuery = {
          delete: vi.fn().mockReturnValue({ eq: mockFirstEq }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.deleteFlashcard(1, mockUserId)).resolves.not.toThrow();
      });
    });

    describe('when operation fails', () => {
      it('should throw error on database error', async () => {
        // Arrange
        const mockError = { message: 'Database error', code: 'DB_ERROR' };
        const mockSecondEq = vi.fn().mockResolvedValue({ error: mockError });
        const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
        const mockQuery = {
          delete: vi.fn().mockReturnValue({ eq: mockFirstEq }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act & Assert
        await expect(service.deleteFlashcard(1, mockUserId)).rejects.toThrow(
          'Failed to delete flashcard: Database error'
        );
      });
    });

    describe('edge cases', () => {
      it('should verify user_id is checked during deletion (security)', async () => {
        // Arrange
        const differentUserId = 'other-user-456';
        const mockSecondEq = vi.fn().mockResolvedValue({ error: null });
        const mockFirstEq = vi.fn().mockReturnValue({ eq: mockSecondEq });
        const mockQuery = {
          delete: vi.fn().mockReturnValue({ eq: mockFirstEq }),
        };
        mockSupabase.from = vi.fn().mockReturnValue(mockQuery);

        // Act
        await service.deleteFlashcard(1, differentUserId);

        // Assert - Ensure user_id is checked
        expect(mockSecondEq).toHaveBeenCalledWith('user_id', differentUserId);
      });
    });
  });
});
