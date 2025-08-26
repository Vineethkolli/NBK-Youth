import ProcessedChunk from '../models/ProcessedChunk.js';
import ProcessedRecord from '../models/ProcessedRecords.js';
import { generateEmbedding } from './embeddingService.js';

// Split text into chunks (copied and slightly adapted)
export const splitIntoChunks = (text, maxTokens = 500) => {
  const sentences = text.split(/[.!?]\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length > maxTokens) {
      for (let i = 0; i < words.length; i += maxTokens) {
        chunks.push(words.slice(i, i + maxTokens).join(' '));
      }
    } else if ((currentChunk + sentence).split(' ').length > maxTokens) {
      if (currentChunk) chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? '. ' : '') + sentence;
    }
  }
  
  if (currentChunk) chunks.push(currentChunk.trim());
  return chunks.filter(chunk => chunk.length > 0);
};

// Process snapshot-like structured record into chunks and save
export const processRecordIntoChunks = async (record, snapshotDataText, metadata = {}, createdBy) => {
  // delete any existing chunks for this event/year
  await ProcessedChunk.deleteMany({ eventName: record.eventName, year: record.year });

  const chunks = splitIntoChunks(snapshotDataText);
  const processedChunks = [];

  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      const processedChunk = new ProcessedChunk({
        eventName: record.eventName,
        year: record.year,
        chunkText: chunk,
        embedding,
        metadata,
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
          allText += `Income ID: ${income.incomeId}, Name: ${income.name}, Amount: ₹${income.amount}, Status: ${income.status}, Payment Mode: ${income.paymentMode}, Belongs To: ${income.belongsTo}, Date: ${income.createdAt}\n`;
        });
        metadata.incomeCount = data.length;
        metadata.totalIncome = data.reduce((sum, i) => sum + i.amount, 0);
      }

      if (collectionName === 'Expense') {
        allText += "\nEXPENSE RECORDS:\n";
        data.forEach(expense => {
          allText += `Expense ID: ${expense.expenseId}, Purpose: ${expense.purpose}, Amount: ₹${expense.amount}, Payment Mode: ${expense.paymentMode}, Spender: ${expense.name}, Date: ${expense.createdAt}\n`;
        });
        metadata.expenseCount = data.length;
        metadata.totalExpense = data.reduce((sum, e) => sum + e.amount, 0);
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
