import { HfInference } from '@huggingface/inference';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import ChatHistory from '../models/ChatHistory.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Collection from '../models/Collection.js';
import Game from '../models/Game.js';
import Moment from '../models/Moment.js';

const hf = new HfInference(process.env.HUGGINGFACE_API_KEY);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Helper function to generate embeddings
const generateEmbedding = async (text) => {
  try {
    const response = await hf.featureExtraction({
      model: 'sentence-transformers/all-MiniLM-L6-v2',
      inputs: text
    });
    return Array.isArray(response[0]) ? response[0] : response;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
};

// Helper function to calculate cosine similarity
const cosineSimilarity = (a, b) => {
  const dotProduct = a.reduce((sum, ai, i) => sum + ai * b[i], 0);
  const magnitudeA = Math.sqrt(a.reduce((sum, ai) => sum + ai * ai, 0));
  const magnitudeB = Math.sqrt(b.reduce((sum, bi) => sum + bi * bi, 0));
  return dotProduct / (magnitudeA * magnitudeB);
};

// Convert records to structured text
const recordsToText = (incomes, expenses) => {
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
const splitIntoChunks = (text, maxTokens = 500) => {
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

// Get time-based greeting
const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

// Detect greeting intent
const isGreeting = (message) => {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  return greetings.some(greeting => message.toLowerCase().includes(greeting));
};

// Detect identity questions
const isIdentityQuestion = (message) => {
  const identityKeywords = ['who are you', 'what are you', 'who is vini', 'about you', 'introduce yourself'];
  return identityKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Detect creator questions
const isCreatorQuestion = (message) => {
  const creatorKeywords = ['who created you', 'who made you', 'who developed you', 'who built you', 'your creator', 'your developer'];
  return creatorKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

// Search current app data
const searchCurrentData = async (query) => {
  const results = [];
  
  try {
    // Search incomes
    const incomes = await Income.find({ 
      isDeleted: false,
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { incomeId: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    // Search expenses
    const expenses = await Expense.find({ 
      isDeleted: false,
      $or: [
        { purpose: { $regex: query, $options: 'i' } },
        { name: { $regex: query, $options: 'i' } }
      ]
    }).limit(10);
    
    // Search users
    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { registerId: { $regex: query, $options: 'i' } }
      ]
    }).limit(5);
    
    // Search payments
    const payments = await Payment.find({
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { paymentId: { $regex: query, $options: 'i' } }
      ]
    }).limit(5);
    
    return { incomes, expenses, users, payments };
  } catch (error) {
    console.error('Error searching current data:', error);
    return { incomes: [], expenses: [], users: [], payments: [] };
  }
};

// Get current stats
const getCurrentStats = async () => {
  try {
    const incomes = await Income.find({ isDeleted: false });
    const expenses = await Expense.find({ isDeleted: false });
    const users = await User.find();
    const payments = await Payment.find({ transactionStatus: 'successful' });
    
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paidIncomes = incomes.filter(income => income.status === 'paid');
    const amountReceived = paidIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      amountReceived,
      totalUsers: users.length,
      totalPayments: payments.length,
      incomeCount: incomes.length,
      expenseCount: expenses.length
    };
  } catch (error) {
    console.error('Error getting current stats:', error);
    return {};
  }
};

// Format response with tables
const formatTableResponse = (data, headers) => {
  if (!data || data.length === 0) return 'No data found.';
  
  let table = '| ' + headers.join(' | ') + ' |\n';
  table += '|' + headers.map(() => '---').join('|') + '|\n';
  
  data.forEach(row => {
    table += '| ' + row.join(' | ') + ' |\n';
  });
  
  return table;
};

export const viniController = {
  // Get all processed events
  getAllProcessedEvents: async (req, res) => {
    try {
      const events = await ProcessedChunk.aggregate([
        {
          $group: {
            _id: { eventName: '$eventName', year: '$year' },
            status: { $first: '$status' },
            chunkCount: { $sum: 1 },
            createdAt: { $first: '$createdAt' },
            createdBy: { $first: '$createdBy' }
          }
        },
        {
          $project: {
            eventName: '$_id.eventName',
            year: '$_id.year',
            status: 1,
            chunkCount: 1,
            createdAt: 1,
            createdBy: 1,
            _id: 0
          }
        },
        { $sort: { year: -1, eventName: 1 } }
      ]);
      
      res.json(events);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch processed events' });
    }
  },

  // Process current data into historical chunks
  processCurrentData: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      
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
            createdBy: req.user.registerId
          });
          
          processedChunks.push(processedChunk);
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }
      
      // Save all chunks
      await ProcessedChunk.insertMany(processedChunks);
      
      res.json({ 
        message: 'Data processed successfully', 
        chunkCount: processedChunks.length 
      });
    } catch (error) {
      console.error('Processing error:', error);
      res.status(500).json({ message: 'Failed to process data' });
    }
  },

  // Update processed event
  updateProcessedEvent: async (req, res) => {
    try {
      const { oldEventName, oldYear, newEventName, newYear } = req.body;
      
      const result = await ProcessedChunk.updateMany(
        { eventName: oldEventName, year: oldYear },
        { eventName: newEventName, year: newYear }
      );
      
      
      res.json({ message: 'Event updated successfully', modifiedCount: result.modifiedCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to update event' });
    }
  },

  // Delete processed event
  deleteProcessedEvent: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      
      const result = await ProcessedChunk.deleteMany({ eventName, year });
      
   
      res.json({ message: 'Event deleted successfully', deletedCount: result.deletedCount });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete event' });
    }
  },

  // Reprocess event data
  reprocessEvent: async (req, res) => {
    try {
      const { eventName, year } = req.body;
      
      // Update status to processing
      await ProcessedChunk.updateMany(
        { eventName, year },
        { status: 'processing' }
      );
      
      // Delete and recreate chunks
      await ProcessedChunk.deleteMany({ eventName, year });
      
      // Fetch current data
      const incomes = await Income.find({ isDeleted: false });
      const expenses = await Expense.find({ isDeleted: false });
      
      // Convert to text and process
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
            createdBy: req.user.registerId
          });
          
          processedChunks.push(processedChunk);
        } catch (error) {
          console.error('Error processing chunk:', error);
        }
      }
      
      await ProcessedChunk.insertMany(processedChunks);
      
      res.json({ message: 'Event reprocessed successfully', chunkCount: processedChunks.length });
    } catch (error) {
      res.status(500).json({ message: 'Failed to reprocess event' });
    }
  },

  // Chat with VINI
  chatWithVini: async (req, res) => {
    try {
      const { message, registerId } = req.body;
      const user = await User.findOne({ registerId });
      const userName = user?.name || 'User';
      
      let response = '';
      
      // Handle greetings
      if (isGreeting(message)) {
        const greeting = getTimeBasedGreeting();
        response = `${greeting}, ${userName}! 😊 How can I help you today?`;
      }
      // Handle identity questions
      else if (isIdentityQuestion(message)) {
        response = `I'm VINI, NBK Youth AI assistant here to answer queries from app data and historical records — quickly, accurately, and naturally.\n\nWhat would you like to know, ${userName}?`;
      }
      // Handle creator questions
      else if (isCreatorQuestion(message)) {
        response = `I was created and set up by Kolli Vineeth, inside your web app to help answer questions from your data instantly and naturally.\n\nHe is basically my developer and boss. 😄`;
      }
      // Handle data queries
      else {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(message);
        
        // Search current app data first
        const currentData = await searchCurrentData(message);
        const currentStats = await getCurrentStats();
        
        // Search historical data
        const historicalChunks = await ProcessedChunk.find({ status: 'ready' });
        const similarities = historicalChunks.map(chunk => ({
          ...chunk.toObject(),
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5);
        
        // Check for direct statistical queries
        if (message.toLowerCase().includes('total income')) {
          if (message.includes('2024') || message.includes('2023')) {
            // Historical query
            const yearMatch = message.match(/\b(20\d{2})\b/);
            if (yearMatch) {
              const year = parseInt(yearMatch[0]);
              const historicalData = similarities.find(chunk => 
                chunk.year === year && chunk.chunkText.includes('INCOME RECORDS')
              );
              if (historicalData) {
                response = `The total income recorded for ${historicalData.eventName} ${year} is ₹${historicalData.metadata.totalIncome?.toLocaleString('en-IN') || 'N/A'}.`;
              } else {
                response = `I couldn't find income data for ${year}. Please make sure the historical data has been processed.`;
              }
            }
          } else {
            // Current query
            response = `The total income for the current event is ₹${currentStats.totalIncome?.toLocaleString('en-IN') || '0'}.`;
          }
        }
        else if (message.toLowerCase().includes('total expense')) {
          if (message.includes('2024') || message.includes('2023')) {
            const yearMatch = message.match(/\b(20\d{2})\b/);
            if (yearMatch) {
              const year = parseInt(yearMatch[0]);
              const historicalData = similarities.find(chunk => 
                chunk.year === year && chunk.chunkText.includes('EXPENSE RECORDS')
              );
              if (historicalData) {
                response = `The total expense recorded for ${historicalData.eventName} ${year} is ₹${historicalData.metadata.totalExpense?.toLocaleString('en-IN') || 'N/A'}.`;
              } else {
                response = `I couldn't find expense data for ${year}.`;
              }
            }
          } else {
            response = `The total expense for the current event is ₹${currentStats.totalExpense?.toLocaleString('en-IN') || '0'}.`;
          }
        }
        else if (message.toLowerCase().includes('how many') && message.toLowerCase().includes('income')) {
          response = `There are ${currentStats.incomeCount || 0} income entries in the current records.`;
        }
        else if (message.toLowerCase().includes('how many') && message.toLowerCase().includes('expense')) {
          response = `There are ${currentStats.expenseCount || 0} expense entries in the current records.`;
        }
        else if (message.toLowerCase().includes('how many') && message.toLowerCase().includes('user')) {
          response = `There are ${currentStats.totalUsers || 0} registered users in the system.`;
        }
        // Handle table requests
        else if (message.toLowerCase().includes('table') && message.toLowerCase().includes('more than')) {
          const amountMatch = message.match(/₹?(\d+)/);
          if (amountMatch) {
            const amount = parseInt(amountMatch[1]);
            const highIncomes = await Income.find({ 
              isDeleted: false, 
              amount: { $gt: amount } 
            }).sort({ amount: -1 }).limit(20);
            
            if (highIncomes.length > 0) {
              const tableData = highIncomes.map(income => [
                income.name,
                `₹${income.amount.toLocaleString('en-IN')}`,
                income.status,
                income.belongsTo
              ]);
              
              response = `Here are the income entries more than ₹${amount.toLocaleString('en-IN')}:\n\n`;
              response += formatTableResponse(tableData, ['Name', 'Amount', 'Status', 'Belongs To']);
            } else {
              response = `No income entries found with amount more than ₹${amount.toLocaleString('en-IN')}.`;
            }
          }
        }
        // Handle table requests for expenses
        else if (message.toLowerCase().includes('expense') && message.toLowerCase().includes('table')) {
          const expenses = await Expense.find({ isDeleted: false }).sort({ amount: -1 }).limit(20);
          
          if (expenses.length > 0) {
            const tableData = expenses.map(expense => [
              expense.purpose,
              `₹${expense.amount.toLocaleString('en-IN')}`,
              expense.paymentMode,
              expense.name
            ]);
            
            response = `Here are the expense records:\n\n`;
            response += formatTableResponse(tableData, ['Purpose', 'Amount', 'Payment Mode', 'Spender']);
          } else {
            response = `No expense records found.`;
          }
        }
        // Handle top contributors
        else if (message.toLowerCase().includes('top') && (message.toLowerCase().includes('contributor') || message.toLowerCase().includes('donor'))) {
          const topIncomes = await Income.find({ 
            isDeleted: false, 
            status: 'paid' 
          }).sort({ amount: -1 }).limit(10);
          
          if (topIncomes.length > 0) {
            const tableData = topIncomes.map((income, index) => [
              (index + 1).toString(),
              income.name,
              `₹${income.amount.toLocaleString('en-IN')}`,
              income.belongsTo
            ]);
            
            response = `Here are the top contributors:\n\n`;
            response += formatTableResponse(tableData, ['Rank', 'Name', 'Amount', 'Category']);
          } else {
            response = `No paid income records found.`;
          }
        }
        // Handle comparison queries
        else if (message.toLowerCase().includes('compare') && message.toLowerCase().includes('vs')) {
          const years = message.match(/\b(20\d{2})\b/g);
          if (years && years.length >= 2) {
            const year1 = parseInt(years[0]);
            const year2 = parseInt(years[1]);
            
            let income1 = 0, income2 = 0;
            let eventName1 = '', eventName2 = '';
            
            // Get historical data for year1
            const historical1 = similarities.find(chunk => chunk.year === year1);
            if (historical1) {
              income1 = historical1.metadata.totalIncome || 0;
              eventName1 = historical1.eventName;
            }
            
            // Get data for year2 (could be current or historical)
            if (year2 === new Date().getFullYear()) {
              income2 = currentStats.totalIncome || 0;
              eventName2 = 'Current Event';
            } else {
              const historical2 = similarities.find(chunk => chunk.year === year2);
              if (historical2) {
                income2 = historical2.metadata.totalIncome || 0;
                eventName2 = historical2.eventName;
              }
            }
            
            const difference = income2 - income1;
            const percentChange = income1 > 0 ? ((difference / income1) * 100).toFixed(1) : 0;
            
            const tableData = [
              [year1.toString(), `₹${income1.toLocaleString('en-IN')}`],
              [year2.toString(), `₹${income2.toLocaleString('en-IN')}`]
            ];
            
            response = `Income Comparison:\n\n`;
            response += formatTableResponse(tableData, ['Year', 'Total Income (₹)']);
            response += `\n**Summary:**\n`;
            response += `The total income ${difference >= 0 ? 'increased' : 'decreased'} by ₹${Math.abs(difference).toLocaleString('en-IN')} from ${year1} to ${year2}, showing a ${Math.abs(percentChange)}% ${difference >= 0 ? 'increase' : 'decrease'}.`;
          }
        }
        // Handle advice queries
        else if (message.toLowerCase().includes('increase income') || message.toLowerCase().includes('improve income')) {
          response = `${userName}, increasing income for your event or group could be done by:\n\n• **Reaching more sponsors** — Approach new individuals or businesses who haven't contributed before.\n• **Encouraging higher contributions** — Offer recognition or benefits for larger amounts.\n• **Adding fundraising activities** — Organize games, raffles, or auctions during the event.\n\nIf you want, I can also check historical data to see which sponsors gave the highest so you can focus on them for boosting income.`;
        }
        // Handle specific amount queries
        else if (message.toLowerCase().includes('amount received') || message.toLowerCase().includes('collected')) {
          response = `The amount received (paid income) for the current event is ₹${currentStats.amountReceived?.toLocaleString('en-IN') || '0'}.`;
        }
        // Handle pending amount queries
        else if (message.toLowerCase().includes('pending') && message.toLowerCase().includes('amount')) {
          const pendingAmount = (currentStats.totalIncome || 0) - (currentStats.amountReceived || 0);
          response = `The pending amount (unpaid income) is ₹${pendingAmount.toLocaleString('en-IN')}.`;
        }
        // Handle balance queries
        else if (message.toLowerCase().includes('balance') || message.toLowerCase().includes('amount left')) {
          const balance = (currentStats.amountReceived || 0) - (currentStats.totalExpense || 0);
          response = `The current balance (amount received minus expenses) is ₹${balance.toLocaleString('en-IN')}.`;
        }
        // Use LLM for complex queries
        else {
          try {
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            
            let context = `You are VINI, NBK Youth AI assistant. Answer based on this data:\n\n`;
            context += `Current Stats: Total Income: ₹${currentStats.totalIncome?.toLocaleString('en-IN')}, Total Expense: ₹${currentStats.totalExpense?.toLocaleString('en-IN')}, Users: ${currentStats.totalUsers}\n\n`;
            
            if (similarities.length > 0) {
              context += `Historical Data:\n`;
              similarities.slice(0, 3).forEach(chunk => {
                context += `${chunk.eventName} ${chunk.year}: ${chunk.chunkText.substring(0, 200)}...\n`;
              });
            }
            
            context += `\nUser Question: ${message}\n\nProvide a helpful, natural response as VINI. Keep it concise and friendly.`;
            
            const result = await model.generateContent(context);
            response = result.response.text();
          } catch (error) {
            console.error('LLM error:', error);
            response = `I'm having trouble processing that query right now. Could you try rephrasing it or ask about specific data like "total income" or "total expenses"?`;
          }
        }
      }
      
      // Save chat history
      try {
        await ChatHistory.findOneAndUpdate(
          { registerId },
          { 
            $push: { 
              chats: { 
                message, 
                response, 
                timestamp: new Date() 
              } 
            } 
          },
          { upsert: true }
        );
      } catch (error) {
        console.error('Error saving chat history:', error);
      }
      
      res.json({ response });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ message: 'Failed to process chat' });
    }
  },

  // Get chat history
  getChatHistory: async (req, res) => {
    try {
      const { registerId } = req.params;
      const chatHistory = await ChatHistory.findOne({ registerId });
      
      res.json(chatHistory?.chats || []);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch chat history' });
    }
  },

  // Clear chat history
  clearChatHistory: async (req, res) => {
    try {
      const { registerId } = req.params;
      
      await ChatHistory.findOneAndUpdate(
        { registerId },
        { chats: [] },
        { upsert: true }
      );
      
      res.json({ message: 'Chat history cleared successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to clear chat history' });
    }
  }
};