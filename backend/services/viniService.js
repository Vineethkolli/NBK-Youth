import { GoogleGenerativeAI } from '@google/generative-ai';
import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Payment from '../models/Payment.js';
import ChatHistory from '../models/ChatHistory.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import Collection from '../models/Collection.js';
import Committee from '../models/Committee.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';
import Event from '../models/Event.js';
import EventLabel from '../models/EventLabel.js';
import Game from '../models/Game.js';
import LockSettings from '../models/LockSettings.js';
import Moment from '../models/Moment.js';
import PaymentDetails from '../models/PaymentDetails.js';
import PreviousYear from '../models/PreviousYear.js';
import Slide from '../models/Slide.js';
import Notification from '../models/Notification.js';
import NotificationHistory from '../models/NotificationHistory.js';
import Banner from '../models/Banner.js';
import ActivityLog from '../models/ActivityLog.js';
import { cosineSimilarity, generateEmbedding } from './embeddingService.js';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const isGreeting = (message) => {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  return greetings.some(greeting => message.toLowerCase().includes(greeting));
};

export const isIdentityQuestion = (message) => {
  const identityKeywords = ['who are you', 'what are you', 'who is vini', 'about you', 'introduce yourself'];
  return identityKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isCreatorQuestion = (message) => {
  const creatorKeywords = ['who created you', 'who made you', 'who developed you', 'who built you', 'your creator', 'your developer'];
  return creatorKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const formatTableResponse = (data, headers) => {
  if (!data || data.length === 0) return 'No data found.';
  
  let table = '| ' + headers.join(' | ') + ' |\n';
  table += '|' + headers.map(() => '---').join('|') + '|\n';
  
  data.forEach(row => {
    table += '| ' + row.join(' | ') + ' |\n';
  });
  
  return table;
};

export const searchCurrentData = async (query) => {
  try {
    const [
      incomes, expenses, users, payments, collections, committees, estimatedIncomes, estimatedExpenses, events, eventLabels, games, lockSettings, moments, paymentDetails, previousYears, slides, notifications, notificationHistories, banners, activityLogs, processedChunks, chatHistories
    ] = await Promise.all([
      Income.find({ isDeleted: false, $or: [ { name: { $regex: query, $options: 'i' } }, { incomeId: { $regex: query, $options: 'i' } } ] }).limit(10),
      Expense.find({ isDeleted: false, $or: [ { purpose: { $regex: query, $options: 'i' } }, { name: { $regex: query, $options: 'i' } } ] }).limit(10),
      User.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { registerId: { $regex: query, $options: 'i' } } ] }).limit(5),
      Payment.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { paymentId: { $regex: query, $options: 'i' } } ] }).limit(5),
      Collection.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { collectionId: { $regex: query, $options: 'i' } } ] }).limit(5),
      Committee.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { committeeId: { $regex: query, $options: 'i' } } ] }).limit(5),
      EstimatedIncome.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { estimatedIncomeId: { $regex: query, $options: 'i' } } ] }).limit(5),
      EstimatedExpense.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { estimatedExpenseId: { $regex: query, $options: 'i' } } ] }).limit(5),
      Event.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { eventId: { $regex: query, $options: 'i' } } ] }).limit(5),
      EventLabel.find({ $or: [ { label: { $regex: query, $options: 'i' } } ] }).limit(5),
      Game.find({ $or: [ { name: { $regex: query, $options: 'i' } }, { gameId: { $regex: query, $options: 'i' } } ] }).limit(5),
      LockSettings.find({ $or: [ { key: { $regex: query, $options: 'i' } } ] }).limit(5),
      Moment.find({ $or: [ { title: { $regex: query, $options: 'i' } } ] }).limit(5),
      PaymentDetails.find({ $or: [ { paymentId: { $regex: query, $options: 'i' } } ] }).limit(5),
      PreviousYear.find({ $or: [ { year: { $regex: query, $options: 'i' } } ] }).limit(5),
      Slide.find({ $or: [ { title: { $regex: query, $options: 'i' } } ] }).limit(5),
      Notification.find({ $or: [ { title: { $regex: query, $options: 'i' } }, { message: { $regex: query, $options: 'i' } } ] }).limit(5),
      NotificationHistory.find({ $or: [ { title: { $regex: query, $options: 'i' } }, { message: { $regex: query, $options: 'i' } } ] }).limit(5),
      Banner.find({ $or: [ { title: { $regex: query, $options: 'i' } } ] }).limit(5),
      ActivityLog.find({ $or: [ { action: { $regex: query, $options: 'i' } }, { user: { $regex: query, $options: 'i' } } ] }).limit(5),
      ChatHistory.find({ chats: { $elemMatch: { message: { $regex: query, $options: 'i' } } } }).limit(5)
    ]);
    return {
      incomes, expenses, users, payments, collections, committees, estimatedIncomes, estimatedExpenses, events, eventLabels, games, lockSettings, moments, paymentDetails, previousYears, slides, notifications, notificationHistories, banners, activityLogs, chatHistories
    };
  } catch (error) {
    console.error('Error searching current data:', error);
    return {};
  }
};

export const getCurrentStats = async () => {
  try {
    const [
      incomes, expenses, users, payments, collections, committees, estimatedIncomes, estimatedExpenses, events, eventLabels, games, lockSettings, moments, paymentDetails, previousYears, slides, notifications, notificationHistories, banners, activityLogs
    ] = await Promise.all([
      Income.find({ isDeleted: false }),
      Expense.find({ isDeleted: false }),
      User.find(),
      Payment.find({ transactionStatus: 'successful' }),
      Collection.find(),
      Committee.find(),
      EstimatedIncome.find(),
      EstimatedExpense.find(),
      Event.find(),
      EventLabel.find(),
      Game.find(),
      LockSettings.find(),
      Moment.find(),
      PaymentDetails.find(),
      PreviousYear.find(),
      Slide.find(),
      Notification.find(),
      NotificationHistory.find(),
      Banner.find(),
      ActivityLog.find()
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
      totalPayments: payments.length,
      incomeCount: incomes.length,
      expenseCount: expenses.length,
      collectionCount: collections.length,
      committeeCount: committees.length,
      estimatedIncomeCount: estimatedIncomes.length,
      estimatedExpenseCount: estimatedExpenses.length,
      eventCount: events.length,
      eventLabelCount: eventLabels.length,
      gameCount: games.length,
      lockSettingCount: lockSettings.length,
      momentCount: moments.length,
      paymentDetailsCount: paymentDetails.length,
      previousYearCount: previousYears.length,
      slideCount: slides.length,
      notificationCount: notifications.length,
      notificationHistoryCount: notificationHistories.length,
      bannerCount: banners.length,
      activityLogCount: activityLogs.length
    };
  } catch (error) {
    console.error('Error getting current stats:', error);
    return {};
  }
};

export const chatWithViniLogic = async ({ message, registerId }) => {
  const user = await User.findOne({ registerId });
  const userName = user?.name || 'User';
  let response = '';
  const msg = message.toLowerCase();

  // Handle greetings
  if (isGreeting(msg)) {
    const greeting = getTimeBasedGreeting();
    response = `${greeting}, ${userName}! 😊 How can I help you today?`;
  }
  // Handle identity questions
  else if (isIdentityQuestion(msg)) {
    response = `I'm VINI, NBK Youth AI assistant here to answer queries from app data and historical records — quickly, accurately, and naturally.\n\nWhat would you like to know, ${userName}?`;
  }
  // Handle creator questions
  else if (isCreatorQuestion(msg)) {
    response = `I was created by Kolli Vineeth for the NBK Youth website and AI assistant.`;
  }
  // Amount paid by Vineeth (current and history, with event/year support)
  else if (msg.includes('vineeth') && (msg.includes('amount paid') || msg.includes('contributed') || msg.includes('donated') || msg.includes('income'))) {
    const yearMatch = message.match(/\b(20\d{2})\b/);
    const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
    let resp = '';
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const eventName = eventMatch ? eventMatch[1] : null;
      const historicalChunks = await ProcessedChunk.find({ 
        status: 'ready', 
        year,
        ...(eventName && { eventName: { $regex: eventName, $options: 'i' } })
      });
      let found = false;
      for (const chunk of historicalChunks) {
        if (chunk.chunkText.toLowerCase().includes('vineeth')) {
          const lines = chunk.chunkText.split('\n').filter(l => l.toLowerCase().includes('vineeth'));
          let amount = null;
          for (const line of lines) {
            const match = line.match(/vineeth[^\d]*(\d{3,})/i);
            if (match) { amount = parseInt(match[1]); break; }
          }
          if (amount) {
            resp = `Vineeth paid ₹${amount.toLocaleString('en-IN')} for ${chunk.eventName} ${year}.`;
            found = true;
            break;
          }
        }
      }
      if (!found) resp = `No record found for Vineeth in ${eventName ? eventName + ' ' : ''}${year}.`;
    } else {
      const vineethIncomes = await Income.find({ isDeleted: false, name: /vineeth/i });
      let total = vineethIncomes.reduce((sum, i) => sum + i.amount, 0);
      if (total > 0) resp = `Vineeth has paid ₹${total.toLocaleString('en-IN')} in the current records.`;
      else resp = `No income records found for Vineeth in current records.`;
    }
    response = resp;
  }
  // Top 3 incomes (current and historical, with event/year support)
  else if ((msg.includes('top') && (msg.includes('income') || msg.includes('contributor') || msg.includes('donor'))) || msg.includes('top 3')) {
    const yearMatch = message.match(/\b(20\d{2})\b/);
    const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
    let resp = '';
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const eventName = eventMatch ? eventMatch[1] : null;
      const historicalChunks = await ProcessedChunk.find({ 
        status: 'ready', 
        year,
        ...(eventName && { eventName: { $regex: eventName, $options: 'i' } })
      });
      let found = false;
      for (const chunk of historicalChunks) {
        const lines = chunk.chunkText.split('\n').filter(l => l.toLowerCase().includes('income id'));
        if (lines.length >= 1) {
          resp += `Top 3 contributors for ${chunk.eventName} ${year} (from records):\n`;
          for (let i = 0; i < 3 && i < lines.length; i++) {
            resp += `${lines[i]}\n`;
          }
          found = true;
          break;
        }
      }
      if (!found) resp = `No top contributors found for ${eventName ? eventName + ' ' : ''}${year}.`;
    } else {
      const topIncomes = await Income.find({ isDeleted: false, status: 'paid' }).sort({ amount: -1 }).limit(3);
      if (topIncomes.length > 0) {
        const tableData = topIncomes.map((income, idx) => [
          (idx + 1).toString(),
          income.name,
          `₹${income.amount.toLocaleString('en-IN')}`,
          income.belongsTo
        ]);
        resp += `Top 3 contributors (current):\n`;
        resp += formatTableResponse(tableData, ['Rank', 'Name', 'Amount', 'Category']);
      } else {
        resp = `No top contributors found in current records.`;
      }
    }
    response = resp;
  }
  // Context-aware total income
  else if (msg.includes('total income')) {
    const yearMatch = message.match(/\b(20\d{2})\b/);
    const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const eventName = eventMatch ? eventMatch[1] : null;
      const historicalChunks = await ProcessedChunk.find({ 
        status: 'ready', 
        year,
        ...(eventName && { eventName: { $regex: eventName, $options: 'i' } })
      });
      let found = false;
      for (const chunk of historicalChunks) {
        response = `The total income for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalIncome?.toLocaleString('en-IN') || 'N/A'}.`;
        found = true;
        break;
      }
      if (!found) response = `No historical income data found for ${eventName ? eventName + ' ' : ''}${year}.`;
    } else {
      const currentStats = await getCurrentStats();
      response = `The total income for the current event is ₹${currentStats.totalIncome?.toLocaleString('en-IN') || '0'}.`;
    }
  }
  // Context-aware total expense
  else if (msg.includes('total expense')) {
    const yearMatch = message.match(/\b(20\d{2})\b/);
    const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);
    if (yearMatch) {
      const year = parseInt(yearMatch[0]);
      const eventName = eventMatch ? eventMatch[1] : null;
      const historicalChunks = await ProcessedChunk.find({ 
        status: 'ready', 
        year,
        ...(eventName && { eventName: { $regex: eventName, $options: 'i' } })
      });
      let found = false;
      for (const chunk of historicalChunks) {
        response = `The total expense for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalExpense?.toLocaleString('en-IN') || 'N/A'}.`;
        found = true;
        break;
      }
      if (!found) response = `No historical expense data found for ${eventName ? eventName + ' ' : ''}${year}.`;
    } else {
      const currentStats = await getCurrentStats();
      response = `The total expense for the current event is ₹${currentStats.totalExpense?.toLocaleString('en-IN') || '0'}.`;
    }
  }
  // Fallback: try to answer with LLM or say developing
  else {
    try {
      const queryEmbedding = await generateEmbedding(message);
      const currentStats = await getCurrentStats();
      const historicalChunks = await ProcessedChunk.find({ status: 'ready' }).limit(10);
      const similarities = historicalChunks.map(chunk => ({
        ...chunk.toObject(),
        similarity: cosineSimilarity(queryEmbedding, chunk.embedding)
      })).sort((a, b) => b.similarity - a.similarity).slice(0, 5);
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
      response = `This feature is in development or not available for your question yet. Please try a different query or ask about income, expenses....`;
    }
  }

  // Save chat history (non-blocking for caller)
  (async () => {
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
      // ignore
    }
  })();

  return response;
};

