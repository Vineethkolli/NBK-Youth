import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import EventLabel from '../models/EventLabel.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import ProcessedRecord from '../models/x.js';
import ChatHistory from '../models/ChatHistory.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cosineSimilarity, generateEmbedding } from './embeddingService.js';
import { 
  getTimeBasedGreeting, 
  getCreativeGreeting, 
  isGreeting, 
  isIdentityQuestion, 
  isCreatorQuestion,
  isNameQuestion,
  isCurrentEventQuestion,
  isMyIncomesQuestion,
  formatTableResponse 
} from './viniResponseService.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getCurrentStats = async () => {
  try {
    const [incomes, expenses, users] = await Promise.all([
      Income.find({ isDeleted: false }),
      Expense.find({ isDeleted: false }),
      User.find()
    ]);
    
    const totalIncome = incomes.reduce((sum, income) => sum + income.amount, 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    const paidIncomes = incomes.filter(income => income.status === 'paid');
    const amountReceived = paidIncomes.reduce((sum, income) => sum + income.amount, 0);
    
    return {
      totalIncome,
      totalExpense,
      amountReceived,
      totalUsers: users.length,
      incomeCount: incomes.length,
      expenseCount: expenses.length
    };
  } catch (error) {
    console.error('Error getting current stats:', error);
    return {};
  }
};

export const searchCurrentData = async (query) => {
  try {
    const [incomes, expenses, users] = await Promise.all([
      Income.find({ 
        isDeleted: false, 
        $or: [ 
          { name: { $regex: query, $options: 'i' } }, 
          { incomeId: { $regex: query, $options: 'i' } } 
        ] 
      }).limit(10),
      Expense.find({ 
        isDeleted: false, 
        $or: [ 
          { purpose: { $regex: query, $options: 'i' } }, 
          { name: { $regex: query, $options: 'i' } } 
        ] 
      }).limit(10),
      User.find({ 
        $or: [ 
          { name: { $regex: query, $options: 'i' } }, 
          { registerId: { $regex: query, $options: 'i' } } 
        ] 
      }).limit(5)
    ]);
    
    return { incomes, expenses, users };
  } catch (error) {
    console.error('Error searching current data:', error);
    return {};
  }
};

export const chatWithViniLogic = async ({ message, registerId }) => {
  const user = await User.findOne({ registerId });
  const userName = user?.name || 'User';
  let response = '';
  const msg = message.toLowerCase();

  try {
    // Handle greetings with creative IST-based responses
    if (isGreeting(msg)) {
      response = getCreativeGreeting(userName);
    }
    // Handle identity questions
    else if (isIdentityQuestion(msg)) {
      response = `I'm VINI, your NBK Youth AI assistant! 🤖 I'm here to help you explore and understand all your app data - from income and expenses to historical records. I can answer questions about current events, past celebrations, financial data, and much more!\n\nWhat would you like to know, ${userName}? ✨`;
    }
    // Handle creator questions
    else if (isCreatorQuestion(msg)) {
      response = `I was created by **Kolli Vineeth** for the NBK Youth website and AI assistant. He developed this entire platform to help manage and track all your community activities! 👨‍💻`;
    }
    // Handle name questions
    else if (isNameQuestion(msg)) {
      response = `Your name is **${userName}**! 😊 Is there anything specific you'd like to know about your data or activities?`;
    }
    // Handle current event questions
    else if (isCurrentEventQuestion(msg)) {
      const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
      if (eventLabel) {
        const currentStats = await getCurrentStats();
        response = `The current event is **${eventLabel.label}**! 🎉\n\nCurrent data summary:\n• Total Income: ₹${currentStats.totalIncome?.toLocaleString('en-IN') || '0'}\n• Amount Received: ₹${currentStats.amountReceived?.toLocaleString('en-IN') || '0'}\n• Total Expenses: ₹${currentStats.totalExpense?.toLocaleString('en-IN') || '0'}\n• Total Users: ${currentStats.totalUsers || 0}\n• Income Entries: ${currentStats.incomeCount || 0}\n• Expense Entries: ${currentStats.expenseCount || 0}`;
      } else {
        response = `No current event label is set. The system is showing general data without a specific event context.`;
      }
    }
    // Handle "show all my incomes" questions
    else if (isMyIncomesQuestion(msg)) {
      const userIncomes = await Income.find({ 
        isDeleted: false, 
        $or: [
          { name: { $regex: userName, $options: 'i' } },
          { registerId: registerId }
        ]
      });
      
      if (userIncomes.length > 0) {
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const eventContext = eventLabel ? `for ${eventLabel.label}` : 'from current records';
        
        const tableData = userIncomes.map(income => [
          income.incomeId,
          income.name,
          `₹${income.amount.toLocaleString('en-IN')}`,
          income.status,
          income.paymentMode
        ]);
        
        response = `Here are all your incomes ${eventContext}:\n\n`;
        response += formatTableResponse(tableData, ['Income ID', 'Name', 'Amount', 'Status', 'Payment Mode']);
        response += `\n\nTotal: ${userIncomes.length} entries, Amount: ₹${userIncomes.reduce((sum, i) => sum + i.amount, 0).toLocaleString('en-IN')}`;
      } else {
        response = `No income records found for you in the current data, ${userName}.`;
      }
    }
    // Amount paid by specific person (current and historical)
    else if (msg.includes('amount paid') || msg.includes('contributed') || msg.includes('donated')) {
      const nameMatch = message.match(/(?:amount paid by|contributed by|donated by)\s+([a-zA-Z\s]+)/i);
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
      
      let searchName = nameMatch ? nameMatch[1].trim() : userName;
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const eventName = eventMatch ? eventMatch[1] : null;
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        let found = false;
        
        for (const chunk of historicalChunks) {
          if ((!eventName || (chunk.eventName && chunk.eventName.toLowerCase().includes(eventName.toLowerCase()))) && 
              chunk.chunkText.toLowerCase().includes(searchName.toLowerCase())) {
            const lines = chunk.chunkText.split('\n').filter(l => l.toLowerCase().includes(searchName.toLowerCase()));
            let amount = null;
            for (const line of lines) {
              const match = line.match(new RegExp(`${searchName}[^\\d]*(\\d{3,})`, 'i'));
              if (match) { 
                amount = parseInt(match[1]); 
                break; 
              }
            }
            if (amount) {
              response = `${searchName} paid ₹${amount.toLocaleString('en-IN')} for ${chunk.eventName} ${year}.`;
              found = true;
              break;
            }
          }
        }
        if (!found) {
          response = `No record found for ${searchName} in ${eventName ? eventName + ' ' : ''}${year}.`;
        }
      } else {
        const currentIncomes = await Income.find({ 
          isDeleted: false, 
          name: { $regex: searchName, $options: 'i' } 
        });
        
        if (currentIncomes.length > 0) {
          const total = currentIncomes.reduce((sum, i) => sum + i.amount, 0);
          const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
          const eventContext = eventLabel ? `for ${eventLabel.label}` : 'in current records';
          response = `${searchName} has paid ₹${total.toLocaleString('en-IN')} ${eventContext}.`;
        } else {
          response = `No income records found for ${searchName} in current records.`;
        }
      }
    }
    // Top N contributors (current and historical)
    else if ((msg.includes('top') && (msg.includes('income') || msg.includes('contributor') || msg.includes('donor'))) || msg.includes('top ')) {
      const numberMatch = message.match(/top\s+(\d+)/i);
      const topN = numberMatch ? parseInt(numberMatch[1]) : 3;
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const eventName = eventMatch ? eventMatch[1] : null;
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        let found = false;
        
        for (const chunk of historicalChunks) {
          if (!eventName || (chunk.eventName && chunk.eventName.toLowerCase().includes(eventName.toLowerCase()))) {
            const lines = chunk.chunkText.split('\n').filter(l => l.toLowerCase().includes('income id'));
            if (lines.length >= 1) {
              response += `Top ${topN} contributors for ${chunk.eventName} ${year}:\n\n`;
              for (let i = 0; i < topN && i < lines.length; i++) {
                response += `${i + 1}. ${lines[i]}\n`;
              }
              found = true;
              break;
            }
          }
        }
        if (!found) {
          response = `No top contributors found for ${eventName ? eventName + ' ' : ''}${year}.`;
        }
      } else {
        const topIncomes = await Income.find({ isDeleted: false, status: 'paid' })
          .sort({ amount: -1 })
          .limit(topN);
          
        if (topIncomes.length > 0) {
          const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
          const eventContext = eventLabel ? `for ${eventLabel.label}` : 'from current records';
          
          const tableData = topIncomes.map((income, idx) => [
            (idx + 1).toString(),
            income.name,
            `₹${income.amount.toLocaleString('en-IN')}`,
            income.belongsTo
          ]);
          
          response += `Top ${topN} contributors ${eventContext}:\n\n`;
          response += formatTableResponse(tableData, ['Rank', 'Name', 'Amount', 'Category']);
        } else {
          response = `No top contributors found in current records.`;
        }
      }
    }
    // Context-aware total income
    else if (msg.includes('total income')) {
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        let found = false;
        
        for (const chunk of historicalChunks) {
          if (!eventMatch || (chunk.eventName && chunk.eventName.toLowerCase().includes(eventMatch[1].toLowerCase()))) {
            response = `The total income for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalIncome?.toLocaleString('en-IN') || 'N/A'}.`;
            found = true;
            break;
          }
        }
        if (!found) {
          response = `No historical income data found for ${eventMatch ? eventMatch[1] + ' ' : ''}${year}.`;
        }
      } else {
        const currentStats = await getCurrentStats();
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const eventContext = eventLabel ? `for ${eventLabel.label}` : 'for the current event';
        response = `The total income ${eventContext} is ₹${currentStats.totalIncome?.toLocaleString('en-IN') || '0'}.`;
      }
    }
    // Context-aware total expense
    else if (msg.includes('total expense')) {
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
      
      if (yearMatch) {
        const year = parseInt(yearMatch[0]);
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        let found = false;
        
        for (const chunk of historicalChunks) {
          if (!eventMatch || (chunk.eventName && chunk.eventName.toLowerCase().includes(eventMatch[1].toLowerCase()))) {
            response = `The total expense for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalExpense?.toLocaleString('en-IN') || 'N/A'}.`;
            found = true;
            break;
          }
        }
        if (!found) {
          response = `No historical expense data found for ${eventMatch ? eventMatch[1] + ' ' : ''}${year}.`;
        }
      } else {
        const currentStats = await getCurrentStats();
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const eventContext = eventLabel ? `for ${eventLabel.label}` : 'for the current event';
        response = `The total expense ${eventContext} is ₹${currentStats.totalExpense?.toLocaleString('en-IN') || '0'}.`;
      }
    }
    // Fallback: try to answer with LLM using both current and historical data
    else {
      try {
        const queryEmbedding = await generateEmbedding(message);
        const currentStats = await getCurrentStats();
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const historicalChunks = await ProcessedChunk.find({ status: 'ready' });
        const processedRecords = await ProcessedRecord.find({ status: 'ready' });
        
        const similarities = historicalChunks.map(chunk => ({
          ...chunk.toObject(),
          similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
        })).sort((a, b) => b.similarity - a.similarity).slice(0, 5);
        
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        let context = `You are VINI, NBK Youth AI assistant. Answer based on this data:\n\n`;
        
        // Current event context
        if (eventLabel) {
          context += `Current Event: ${eventLabel.label}\n`;
        }
        
        // Current stats
        context += `Current Stats: Total Income: ₹${currentStats.totalIncome?.toLocaleString('en-IN')}, Total Expense: ₹${currentStats.totalExpense?.toLocaleString('en-IN')}, Amount Received: ₹${currentStats.amountReceived?.toLocaleString('en-IN')}, Users: ${currentStats.totalUsers}, Income Entries: ${currentStats.incomeCount}, Expense Entries: ${currentStats.expenseCount}\n\n`;
        
        // Available historical events
        if (processedRecords.length > 0) {
          context += `Available Historical Events:\n`;
          processedRecords.forEach(record => {
            context += `- ${record.eventName} ${record.year} (${record.selectedCollections.join(', ')})\n`;
          });
          context += '\n';
        }
        
        // Historical data context
        if (similarities.length > 0) {
          context += `Historical Data:\n`;
          similarities.slice(0, 3).forEach(chunk => {
            context += `${chunk.eventName} ${chunk.year}: ${chunk.chunkText.substring(0, 300)}...\n\n`;
          });
        }
        
        context += `\nUser Question: ${message}\n\nUser asking: ${userName} (${registerId})\n\nProvide a helpful, natural response as VINI. Keep it concise and friendly. Use all available current and historical data if relevant. If you mention amounts, use Indian number formatting with ₹ symbol.`;
        
        const result = await model.generateContent(context);
        response = result.response.text();
      } catch (error) {
        console.error('LLM Error:', error);
        response = `I'm still learning to answer that type of question! 🤔 Try asking about:\n\n• Current event details\n• Total income/expenses\n• Top contributors\n• Specific person's contributions\n• Your income records\n\nOr ask about any specific year like "Sankranti 2024" for historical data!`;
      }
    }

    // Save chat history (non-blocking)
    setImmediate(async () => {
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
        console.error('Failed to save chat history:', error);
      }
    });

    return response;
  } catch (error) {
    console.error('Chat logic error:', error);
    return `Sorry, I encountered an error processing your request. Please try again! 😅`;
  }
};