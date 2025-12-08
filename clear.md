# Hugging Face Embedding Flow

## When the Hugging Face API is called
- **Chunk creation (one-time per snapshot process/reprocess):** `processRecordIntoChunks` (triggered by `processRecord` or `reprocessRecord` in `backend/controllers/viniController.js`) calls `generateEmbedding` once for every chunk it builds from the snapshot text. This is where the bulk of Hugging Face calls happen.
- **User questions that need historical similarity:** In `backend/services/viniService.js`, branches that compare a user question to historical chunks call `generateEmbedding` for the **query text** (e.g., "amount paid by <name> 2023", "top 5 contributors 2022", or any fallback question). This is one call per such user message.
- **Simple/current-data answers:** Greetings, identity questions, current stats, current incomes, and other direct DB queries do **not** call Hugging Face.

## What is stored
- Chunk embeddings from processing/reprocessing are saved in MongoDB collection `ProcessedChunk` (`chunkText`, `embedding`, `metadata`, `eventName`, `year`, etc.).
- These stored embeddings are reused during chat; chunks are **not** re-embedded on every question.

## Runtime lookup flow (chat)
1. Try fast paths (greeting/identity/name/current event/stats/my incomes/current top contributors). No embeddings involved.
2. Historical-style questions (with a year or requiring past data) fetch matching `ProcessedChunk` documents and compute cosine similarity between the stored chunk embedding and a **fresh embedding of the user question** (one Hugging Face call).
3. General/fallback questions also embed the user message once, score against all ready `ProcessedChunk` entries, and send the top chunks as context to Gemini.

## Processing vs. searching
- **Process / Reprocess:** Calls Hugging Face for every chunk while building them, then stores the embeddings. Reprocess first deletes prior chunks for that event/year, then re-creates and re-embeds.
- **Search/Chat:** Uses the stored chunk embeddings. Hugging Face is only called to embed the **user’s query** when similarity scoring is needed; chunk embeddings are read from DB, not regenerated.

## Notes
- Hugging Face auth comes from `HUGGINGFACE_API_KEY` env var (used by `@huggingface/inference`).
- If there are no `ProcessedChunk` records for a year/event, historical-style questions will have no chunks to compare against.
