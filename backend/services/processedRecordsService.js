// processedrecordservice.js
import ProcessedChunk from '../models/ProcessedChunk.js';
import ProcessedRecord from '../models/ProcessedRecords.js';
import { generateEmbedding } from './embeddingService.js';

/**
 * Split a long snapshot text into lines and then group lines into chunks.
 * Keeps a small overlap of lines between chunks to preserve context.
 *
 * Returns array of chunk objects:
 *  { text: string, incomeIds: [], expenseIds: [], names: [], startLine, endLine }
 */
const createChunksFromLines = (lines = [], maxWords = 300, overlapLines = 3) => {
  const chunks = [];
  let currentLines = [];
  let currentWordCount = 0;
  let lineIndex = 0;

  const extractIdsAndNamesFromLine = (line) => {
    const incomeIdMatch = line.match(/Income ID:\s*([^\s,]+)/i);
    const expenseIdMatch = line.match(/Expense ID:\s*([^\s,]+)/i);
    const nameMatch = line.match(/Name:\s*([^,]+)/i) || line.match(/Spender:\s*([^,]+)/i) || line.match(/Paid by:\s*([^,]+)/i);
    const amountMatch = line.match(/Amount:\s*₹?\s*([\d,\.]+)/i);

    return {
      incomeId: incomeIdMatch ? incomeIdMatch[1].trim() : null,
      expenseId: expenseIdMatch ? expenseIdMatch[1].trim() : null,
      name: nameMatch ? nameMatch[1].trim() : null,
      amountStr: amountMatch ? amountMatch[1].trim() : null
    };
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const wordsInLine = line.split(/\s+/).filter(Boolean).length;

    if (currentWordCount + wordsInLine > maxWords && currentLines.length > 0) {
      const start = lineIndex;
      const end = i - 1;
      const chunkText = currentLines.join(' ');
      // collect ids/names in this chunk
      const incomeIds = new Set();
      const expenseIds = new Set();
      const names = new Set();
      const amountStrings = [];

      currentLines.forEach(l => {
        const parsed = extractIdsAndNamesFromLine(l);
        if (parsed.incomeId) incomeIds.add(parsed.incomeId);
        if (parsed.expenseId) expenseIds.add(parsed.expenseId);
        if (parsed.name) names.add(parsed.name);
        if (parsed.amountStr) amountStrings.push(parsed.amountStr);
      });

      chunks.push({
        text: chunkText,
        incomeIds: Array.from(incomeIds),
        expenseIds: Array.from(expenseIds),
        names: Array.from(names),
        amountStrings,
        startLine: start,
        endLine: end
      });

      // Prepare next chunk with overlap
      const overlapStart = Math.max(0, currentLines.length - overlapLines);
      const overlapPart = currentLines.slice(overlapStart);
      currentLines = [...overlapPart];
      currentWordCount = currentLines.join(' ').split(/\s+/).filter(Boolean).length;
      lineIndex = i - currentLines.length;
    }

    // add current line
    currentLines.push(line);
    currentWordCount += wordsInLine;
  }

  // push remaining lines
  if (currentLines.length > 0) {
    const start = lineIndex;
    const end = lines.length - 1;
    const chunkText = currentLines.join(' ');
    const incomeIds = new Set();
    const expenseIds = new Set();
    const names = new Set();
    const amountStrings = [];

    currentLines.forEach(l => {
      const parsed = extractIdsAndNamesFromLine(l);
      if (parsed.incomeId) incomeIds.add(parsed.incomeId);
      if (parsed.expenseId) expenseIds.add(parsed.expenseId);
      if (parsed.name) names.add(parsed.name);
      if (parsed.amountStr) amountStrings.push(parsed.amountStr);
    });

    chunks.push({
      text: chunkText,
      incomeIds: Array.from(incomeIds),
      expenseIds: Array.from(expenseIds),
      names: Array.from(names),
      amountStrings,
      startLine: start,
      endLine: end
    });
  }

  return chunks;
};

// Small helper: produce a normalized array of non-empty lines from allText
const linesFromText = (text) =>
  text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

// Process snapshot-like structured record into chunks and save
export const processRecordIntoChunks = async (record, snapshotDataText, metadata = {}, createdBy) => {
  // delete any existing chunks for this event/year
  await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });

  const lines = linesFromText(snapshotDataText);
  // Create smart chunks from lines
  const rawChunks = createChunksFromLines(lines, 300, 3); // tweak maxWords and overlapLines if you need finer chunks

  const processedChunks = [];

  for (const rChunk of rawChunks) {
    try {
      const embedding = await generateEmbedding(rChunk.text);

      const processedChunk = new ProcessedChunk({
        eventName: record.eventName,
        year: record.year,
        chunkText: rChunk.text,
        embedding,
        metadata: {
          ...metadata,
          incomeIds: rChunk.incomeIds,
          expenseIds: rChunk.expenseIds,
          names: rChunk.names,
          amountStrings: rChunk.amountStrings,
          startLine: rChunk.startLine,
          endLine: rChunk.endLine
        },
        status: 'ready',
        createdBy: createdBy || record.createdBy
      });

      processedChunks.push(processedChunk);
    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  }

  if (processedChunks.length > 0) await ProcessedChunk.insertMany(processedChunks);
  return processedChunks.length;
};

// Small helper to build snapshot text from a snapshot object (keeps parity with previous controller logic)
export const buildSnapshotTextFromRecord = (record) => {
  const snapshot = record.snapshotId;
  let allText = '';
  let metadata = {};

  const collections = Array.isArray(record.selectedCollections) && record.selectedCollections.length > 0
    ? record.selectedCollections
    : ['Income', 'Expense', 'Stats'];

  collections.forEach(collectionName => {
    if (snapshot.collections && snapshot.collections[collectionName]) {
      const data = snapshot.collections[collectionName];
      if (collectionName === 'Income') {
        allText += "INCOME RECORDS:\n";
        data.forEach(income => {
          // Keep one line per income to make chunking simpler
          allText += `Income ID: ${income.incomeId}, Name: ${income.name}, Amount: ₹${income.amount}, Status: ${income.status}, Payment Mode: ${income.paymentMode}, Belongs To: ${income.belongsTo}, Date: ${income.createdAt}\n`;
        });
        metadata.incomeCount = data.length;
        metadata.totalIncome = data.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
      }

      if (collectionName === 'Expense') {
        allText += "\nEXPENSE RECORDS:\n";
        data.forEach(expense => {
          allText += `Expense ID: ${expense.expenseId}, Purpose: ${expense.purpose}, Amount: ₹${expense.amount}, Payment Mode: ${expense.paymentMode}, Spender: ${expense.name}, Date: ${expense.createdAt}\n`;
        });
        metadata.expenseCount = data.length;
        metadata.totalExpense = data.reduce((sum, e) => sum + (Number(e.amount) || 0), 0);
      }

      if (collectionName === 'EstimatedIncome') {
        allText += "\nESTIMATED INCOME RECORDS:\n";
        data.forEach(income => {
          allText += `Name: ${income.name}, Present Amount: ₹${income.presentAmount}, Status: ${income.status}, Belongs To: ${income.belongsTo}\n`;
        });
      }

      if (collectionName === 'EstimatedExpense') {
        allText += "\nESTIMATED EXPENSE RECORDS:\n";
        data.forEach(expense => {
          allText += `Purpose: ${expense.purpose}, Present Amount: ₹${expense.presentAmount}\n`;
        });
      }
    }

    if (collectionName === 'Stats' && snapshot.stats) {
      allText += "\nSTATISTICS:\n";
      allText += `Total Income: ₹${snapshot.stats.budgetStats?.totalIncome?.amount || 0}\n`;
      allText += `Amount Received: ₹${snapshot.stats.budgetStats?.amountReceived?.amount || 0}\n`;
      allText += `Total Expenses: ₹${snapshot.stats.budgetStats?.totalExpenses?.amount || 0}\n`;
      allText += `Amount Left: ₹${snapshot.stats.budgetStats?.amountLeft?.amount || 0}\n`;
    }
  });

  return { allText, metadata };
};
