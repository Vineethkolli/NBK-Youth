import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import { generateEmbedding } from './embeddingService.js';

// Convert records to structured text
export const recordsToText = (incomes, expenses) => {
  let text = "INCOME RECORDS:\n";
  incomes.forEach(income => {
    text += `Income ID: ${income.incomeId}, Name: ${income.name}, Amount: ₹${income.amount}, Status: ${income.status}, Payment Mode: ${income.paymentMode}, Belongs To: ${income.belongsTo}, Date: ${income.createdAt}\n`;
  });
  
  text += "\nEXPENSE RECORDS:\n";
  expenses.forEach(expense => {
    text += `Expense ID: ${expense.expenseId}, Purpose: ${expense.purpose}, Amount: ₹${expense.amount}, Payment Mode: ${expense.paymentMode}, Spender: ${expense.name}, Date: ${expense.createdAt}\n`;
  });
  
  return text;
};

// Split text into chunks
export const splitIntoChunks = (text, maxTokens = 500) => {
  const sentences = text.split(/[.!?]\s+/);
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    const words = sentence.split(' ');
    if (words.length > maxTokens) {
      // Split very long sentences
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

// Process current data into historical chunks
export const processCurrentData = async ({ eventName, year, createdBy }) => {
  // Delete existing chunks for this event
  await ProcessedChunk.deleteMany({ eventName, year });
  
  // Fetch current data
  const incomes = await Income.find({ isDeleted: false });
  const expenses = await Expense.find({ isDeleted: false });
  
  // Convert to text
  const structuredText = recordsToText(incomes, expenses);
  
  // Split into chunks
  const chunks = splitIntoChunks(structuredText);
  
  // Process each chunk
  const processedChunks = [];
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      
      const processedChunk = new ProcessedChunk({
        eventName,
        year,
        chunkText: chunk,
        embedding,
        metadata: {
          incomeCount: incomes.length,
          expenseCount: expenses.length,
          totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
          totalExpense: expenses.reduce((sum, e) => sum + e.amount, 0)
        },
        status: 'ready',
        createdBy
      });
      
      processedChunks.push(processedChunk);
    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  }
  
  // Save all chunks
  if (processedChunks.length > 0) await ProcessedChunk.insertMany(processedChunks);
  
  return processedChunks.length;
};

// Reprocess event
export const reprocessEventData = async ({ eventName, year, createdBy }) => {
  // Update status to processing
  await ProcessedChunk.updateMany({ eventName, year }, { status: 'processing' });
  
  // Delete and recreate chunks
  await ProcessedChunk.deleteMany({ eventName, year });
  
  const incomes = await Income.find({ isDeleted: false });
  const expenses = await Expense.find({ isDeleted: false });
  
  const structuredText = recordsToText(incomes, expenses);
  const chunks = splitIntoChunks(structuredText);
  
  const processedChunks = [];
  for (const chunk of chunks) {
    try {
      const embedding = await generateEmbedding(chunk);
      
      const processedChunk = new ProcessedChunk({
        eventName,
        year,
        chunkText: chunk,
        embedding,
        metadata: {
          incomeCount: incomes.length,
          expenseCount: expenses.length,
          totalIncome: incomes.reduce((sum, i) => sum + i.amount, 0),
          totalExpense: expenses.reduce((sum, e) => sum + e.amount, 0)
        },
        status: 'ready',
        createdBy
      });
      
      processedChunks.push(processedChunk);
    } catch (error) {
      console.error('Error processing chunk:', error);
    }
  }
  
  if (processedChunks.length > 0) await ProcessedChunk.insertMany(processedChunks);
  
  return processedChunks.length;
};
