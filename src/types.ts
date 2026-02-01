// src/types.ts
import type { Database } from "./db/database.types";

// ------------------------------------------------------------------------------------------------
// Aliases for base database types extracted from the Database model definitions
// ------------------------------------------------------------------------------------------------
export type Flashcard = Database["public"]["Tables"]["flashcards"]["Row"];
export type FlashcardInsert = Database["public"]["Tables"]["flashcards"]["Insert"];
export type Generation = Database["public"]["Tables"]["generations"]["Row"];
export type GenerationErrorLog = Database["public"]["Tables"]["generation_error_logs"]["Row"];

// ------------------------------------------------------------------------------------------------
// 1. Flashcard DTO
//    Represents a flashcard as returned by the API endpoints (GET /flashcards, GET /flashcards/{id})
// ------------------------------------------------------------------------------------------------
export type FlashcardDto = Pick<
  Flashcard,
  "id" | "front" | "back" | "source" | "generation_id" | "created_at" | "updated_at"
>;

// ------------------------------------------------------------------------------------------------
// 2. Pagination DTO
//    Contains pagination details used in list responses
// ------------------------------------------------------------------------------------------------
export interface PaginationDto {
  page: number;
  limit: number;
  total: number;
}

// ------------------------------------------------------------------------------------------------
// 3. Flashcards List Response DTO
//    Combines an array of flashcards with pagination metadata (GET /flashcards)
// ------------------------------------------------------------------------------------------------
export interface FlashcardsListResponseDto {
  data: FlashcardDto[];
  pagination: PaginationDto;
}

// ------------------------------------------------------------------------------------------------
// 4. Flashcard Create DTO & Command Model
//    Used in the POST /flashcards endpoint to create one or more flashcards.
//    Validation rules:
//      - front: maximum length 200 characters
//      - back: maximum length 500 characters
//      - source: must be one of "ai-full", "ai-edited", or "manual"
//      - generation_id: required for "ai-full" and "ai-edited", must be null for "manual"
// ------------------------------------------------------------------------------------------------
export type Source = "ai-full" | "ai-edited" | "manual";

export interface FlashcardCreateDto {
  front: string;
  back: string;
  source: Source;
  generation_id: number | null;
}

export interface FlashcardsCreateCommand {
  flashcards: FlashcardCreateDto[];
}

// ------------------------------------------------------------------------------------------------
// 5. Flashcard Update DTO (Command Model)
//    For the PUT /flashcards/{id} endpoint to update existing flashcards.
//    This model is a partial update of flashcard fields.
// ------------------------------------------------------------------------------------------------
export interface FlashcardUpdateDto {
  front?: string;
  back?: string;
}

export interface FlashcardUpdateCommand {
  front?: string;
  back?: string;
}

// ------------------------------------------------------------------------------------------------
// 6. Generate Flashcards Command
//    Used in the POST /generations endpoint to initiate the AI flashcard generation process.
//    The "source_text" must be between 1000 and 10000 characters.
// ------------------------------------------------------------------------------------------------
export interface GenerateFlashcardsCommand {
  source_text: string;
}

// ------------------------------------------------------------------------------------------------
// 7. Flashcard Proposal DTO
//    Represents a single flashcard proposal generated from AI, always with source "ai-full".
// ------------------------------------------------------------------------------------------------
export interface FlashcardProposalDto {
  front: string;
  back: string;
  source: "ai-full";
}

// ------------------------------------------------------------------------------------------------
// 8. Generation Create Response DTO
//    This type describes the response from the POST /generations endpoint.
// ------------------------------------------------------------------------------------------------
export interface GenerationCreateResponseDto {
  generation_id: number;
  flashcards_proposals: FlashcardProposalDto[];
  generated_count: number;
}

// ------------------------------------------------------------------------------------------------
// 9. Generation Detail DTO
//    Provides detailed information for a generation request (GET /generations/{id}),
//    including metadata from the generations table and optionally, the associated flashcards.
// ------------------------------------------------------------------------------------------------
export type GenerationDetailDto = Generation & {
  flashcards?: FlashcardDto[];
};

// ------------------------------------------------------------------------------------------------
// 10. Generation Error Log DTO
//     Represents an error log entry for the AI flashcard generation process (GET /generation-error-logs).
// ------------------------------------------------------------------------------------------------
export type GenerationErrorLogDto = Pick<
  GenerationErrorLog,
  "id" | "error_code" | "error_message" | "model" | "source_text_hash" | "source_text_length" | "created_at" | "user_id"
>;

// ------------------------------------------------------------------------------------------------
// 11. Flashcard Proposal View Model
//     Extended model for managing flashcard proposal state in the UI.
//     Tracks whether a proposal has been accepted or edited by the user.
// ------------------------------------------------------------------------------------------------
export interface FlashcardProposalViewModel {
  front: string;
  back: string;
  source: "ai-full" | "ai-edited";
  accepted: boolean;
  edited: boolean;
}

// ------------------------------------------------------------------------------------------------
// 12. Authentication Types
//     Types for authentication-related functionality
// ------------------------------------------------------------------------------------------------

export interface AuthUser {
  id: string;
  email: string;
}

export interface LoginFormProps {
  redirectTo?: string;
  message?: string | null;
}

export interface RegisterFormProps {}

export interface ResetPasswordFormProps {
  mode: "request" | "update";
  accessToken?: string;
}

export interface AuthenticatedNavbarProps {
  user: AuthUser;
}

export interface AccountSettingsProps {
  user: AuthUser;
}

// ------------------------------------------------------------------------------------------------
// 13. Flashcard Management Types
//     Types for managing saved flashcards in the UI
// ------------------------------------------------------------------------------------------------

export interface FlashcardListFilters {
  source?: Source;
  search?: string;
}

export interface FlashcardListSort {
  field: "created_at" | "updated_at" | "front";
  order: "asc" | "desc";
}

export interface FlashcardWithActions extends FlashcardDto {
  isEditing?: boolean;
}

export type AuthErrorCode =
  | "INVALID_CREDENTIALS"
  | "EMAIL_ALREADY_EXISTS"
  | "WEAK_PASSWORD"
  | "INVALID_EMAIL"
  | "EMAIL_NOT_VERIFIED"
  | "INVALID_RESET_TOKEN"
  | "NETWORK_ERROR"
  | "SERVER_ERROR"
  | "UNAUTHORIZED"
  | "INVALID_CONFIRMATION"
  | "ACCOUNT_DELETION_FAILED";

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  redirectTo?: string;
  message?: string;
  user?: AuthUser;
}
