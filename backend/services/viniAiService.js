import { GoogleGenerativeAI } from '@google/generative-ai';
import { generateEmbedding, calculateSimilarity } from './embeddingService.js';
import ProcessedData from '../models/ProcessedData.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import User from '../models/User.js';
import Payment from '../models/Payment.js';
import Game from '../models/Game.js';
import Collection from '../models/Collection.js';
import Moment from '../models/Moment.js';
import EventLabel from '../models/EventLabel.js';
import Record from '../models/Record.js';
import Committee from '../models/Committee.js';
import EstimatedIncome from '../models/EstimatedIncome.js';
import EstimatedExpense from '../models/EstimatedExpense.js';

// List all models for dynamic fetching and context
const ALL_MODELS = [
  { name: 'incomes', model: Income },
  { name: 'expenses', model: Expense },
  { name: 'users', model: User },
  { name: 'payments', model: Payment },
  { name: 'games', model: Game },
  { name: 'collections', model: Collection },
  { name: 'moments', model: Moment },
  { name: 'eventLabels', model: EventLabel },
  { name: 'records', model: Record },
  { name: 'committees', model: Committee },
  { name: 'estimatedIncomes', model: EstimatedIncome },
  { name: 'estimatedExpenses', model: EstimatedExpense },
];

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const processViniQuery = async (query, userRegisterId) => {
  const startTime = Date.now();
  try {
    // Get user info for personalization
    const user = await User.findOne({ registerId: userRegisterId });
    const userName = user?.name || 'there';

    // Detect query type and intent
    const queryIntent = detectQueryIntent(query);

    // Handle greetings
    if (queryIntent.type === 'greeting') {
      return {
        response: generateGreeting(userName),
        dataSource: 'general',
        responseTime: Date.now() - startTime
      };
    }
    // Handle identity questions
    if (queryIntent.type === 'identity') {
      return {
        response: generateIdentityResponse(userName),
        dataSource: 'general',
        responseTime: Date.now() - startTime
      };
    }
    // Handle developer questions
    if (queryIntent.type === 'developer') {
      return {
        response: generateDeveloperResponse(userName),
        dataSource: 'general',
        responseTime: Date.now() - startTime
      };
    }
    // Handle advice questions
    if (queryIntent.type === 'advice') {
      return {
        response: generateAdviceResponse(query, userName),
        dataSource: 'general',
        responseTime: Date.now() - startTime
      };
    }

    // For all app data questions, always use Gemini AI for analysis and response
    const appData = await searchAppData();
    const context = formatContextForLLM({ appData, historicalData: [] }, query);
    const llmResponse = await getLLMResponse(query, context, queryIntent.complexity, userName);
    return {
      response: llmResponse,
      dataSource: 'app_data',
      responseTime: Date.now() - startTime
    };
  } catch (error) {
    console.error('VINI query processing error:', error);
    return {
      response: `Sorry ${userName}, I encountered an error while processing your question. Please try again.`,
      dataSource: 'general',
      responseTime: Date.now() - startTime
    };
  }
};

const detectQueryIntent = (query) => {
  const lowerQuery = query.toLowerCase();
  
  // Greeting detection
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening'];
  if (greetings.some(g => lowerQuery.includes(g))) {
    return { type: 'greeting' };
  }
  
  // Identity questions
  const identityKeywords = ['who are you', 'what are you'];
  if (identityKeywords.some(k => lowerQuery.includes(k))) {
    return { type: 'identity' };
  }
  
  // Developer questions
  const developerKeywords = ['who created you', 'who made you', 'who developed', 'who built', 'developer'];
  if (developerKeywords.some(k => lowerQuery.includes(k))) {
    return { type: 'developer' };
  }
  
  // Advice questions
  const adviceKeywords = ['how to', 'how can i', 'suggest', 'advice', 'recommend'];
  if (adviceKeywords.some(k => lowerQuery.includes(k))) {
    return { type: 'advice' };
  }
  
  // Comparison queries (complex)
  const comparisonKeywords = ['vs', 'versus', 'compare', 'comparison', 'difference between'];
  const hasMultipleYears = (lowerQuery.match(/20\d{2}/g) || []).length > 1;
  
  if (comparisonKeywords.some(k => lowerQuery.includes(k)) || hasMultipleYears) {
    return { type: 'comparison', complexity: 'complex' };
  }
  
  // Table format requests
  const tableKeywords = ['table', 'list', 'show all', 'display'];
  if (tableKeywords.some(k => lowerQuery.includes(k))) {
    return { type: 'data', complexity: 'complex', format: 'table' };
  }
  
  return { type: 'data', complexity: 'simple' };
};

const generateGreeting = (userName) => {
  const hour = new Date().getHours();
  let timeGreeting = '';
  
  if (hour < 12) timeGreeting = 'Good morning';
  else if (hour < 17) timeGreeting = 'Good afternoon';
  else timeGreeting = 'Good evening';
  
  const greetings = [
    `${timeGreeting}, ${userName}! How can I help you today?`,
    `Hi ${userName}! Hope you're doing well. What would you like to know?`,
    `Hello ${userName}! I'm here to help with any questions about your app data or records.`
  ];
  
  return greetings[Math.floor(Math.random() * greetings.length)];
};

const generateIdentityResponse = (userName) => {
  return `I'm VINI, NBK Youth AI assistant here to answer queries from app data and historical records — quickly, accurately, and naturally.\n\nWhat would you like to know, ${userName}?`;
};

const generateDeveloperResponse = (userName) => {
  return `I was created and set up by Kolli Vineeth inside your web app to help answer questions from your data instantly. He's basically my developer and boss! 😄\n\nWhat would you like to know, ${userName}?`;
};

const generateAdviceResponse = (query, userName) => {
  const lowerQuery = query.toLowerCase();
  
  if (lowerQuery.includes('income')) {
    return `${userName}, increasing income for your event or group could be done by:\n\n• **Reaching more sponsors** — Approach new individuals or businesses who haven't contributed before.\n• **Encouraging higher contributions** — Offer recognition or benefits for larger amounts.\n• **Adding fundraising activities** — Organize games, raffles, or auctions during the event.\n\nIf you want, I can also check historical data to see which sponsors gave the highest so you can focus on them for boosting income.`;
  }
  
  return `${userName}, I'd be happy to help with advice! Could you be more specific about what you'd like guidance on? I can provide insights based on your app data and historical records.`;
};

const searchAllSources = async (query) => {
  const queryEmbedding = await generateEmbedding(query);
  
  // Search current app data
  const appData = await searchAppData(query);
  
  // Search historical records
  const historicalData = await searchHistoricalData(queryEmbedding, query);
  
  return { appData, historicalData };
};

// Dynamically fetch all models for maximum coverage
const searchAppData = async () => {
  const results = {};
  try {
    for (const entry of ALL_MODELS) {
      if (entry.name === 'incomes' || entry.name === 'expenses') {
        results[entry.name] = await entry.model.find({ isDeleted: false });
      } else if (entry.name === 'users') {
        results[entry.name] = await entry.model.find().select('-password');
      } else if (entry.name === 'eventLabels') {
        results.eventLabel = await entry.model.findOne().sort({ createdAt: -1 });
      } else {
        results[entry.name] = await entry.model.find();
      }
    }
  } catch (error) {
    console.error('Error searching app data:', error);
  }
  return results;
};

const searchHistoricalData = async (queryEmbedding, query) => {
  try {
    // Get all processed data
    const processedRecords = await ProcessedData.find({ 'chunks.0': { $exists: true } });
    
    const results = [];
    
    for (const record of processedRecords) {
      for (const chunk of record.chunks) {
        const similarity = calculateSimilarity(queryEmbedding, chunk.embedding);
        
        if (similarity > 0.6) { // Lower threshold for better recall
          results.push({
            text: chunk.text,
            similarity,
            recordYear: record.recordYear,
            fileName: record.fileName,
            metadata: chunk.metadata,
            structuredData: record.structuredData,
            totals: {
              income: record.totalIncome,
              expense: record.totalExpense,
              count: record.entryCount
            },
            extractedFields: record.extractedFields || []
          });
        }
      }
    }
    
    // Sort by similarity
    return results.sort((a, b) => b.similarity - a.similarity).slice(0, 15);
  } catch (error) {
    console.error('Error searching historical data:', error);
    return [];
  }
};

const getDirectAnswer = async (query, appData) => {
  const lowerQuery = query.toLowerCase();

  // Get current event label for context
  const currentEvent = appData.eventLabel?.label || 'current period';

  // Top N highest incomes (e.g., "top 5 highest incomes", "top contributors")
  const topNMatch = lowerQuery.match(/top\s*(\d+)\s*(highest|biggest)?\s*(income|contributor|amount|donation|entries|people)?/);
  if (topNMatch && appData.incomes && appData.incomes.length > 0) {
    const n = parseInt(topNMatch[1]) || 5;
    // Sort by amount descending
    const sorted = [...appData.incomes].sort((a, b) => b.amount - a.amount).slice(0, n);
    let table = `Here are the top ${n} highest incomes for ${currentEvent}:\n\n`;
    table += `| Name | Amount |\n|------|--------|\n`;
    sorted.forEach(income => {
      table += `| ${income.name || '-'} | ₹${income.amount.toLocaleString('en-IN')} |\n`;
    });
    return table;
  }

  // Total income queries
  if (lowerQuery.includes('total income') && !lowerQuery.includes('20')) {
    const totalIncome = appData.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0;
    return `The total income for ${currentEvent} is ₹${totalIncome.toLocaleString('en-IN')}.`;
  }

  // Total expense queries
  if (lowerQuery.includes('total expense') && !lowerQuery.includes('20')) {
    const totalExpense = appData.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
    return `The total expenses for ${currentEvent} is ₹${totalExpense.toLocaleString('en-IN')}.`;
  }

  // Count queries
  if (lowerQuery.includes('how many') && lowerQuery.includes('income')) {
    const count = appData.incomes?.length || 0;
    return `There are ${count} income entries recorded for ${currentEvent}.`;
  }

  if (lowerQuery.includes('how many') && lowerQuery.includes('user')) {
    const count = appData.users?.length || 0;
    return `There are ${count} registered users in the system.`;
  }

  // Payment status queries
  if (lowerQuery.includes('paid') && lowerQuery.includes('income')) {
    const paidIncomes = appData.incomes?.filter(income => income.status === 'paid') || [];
    const paidAmount = paidIncomes.reduce((sum, income) => sum + income.amount, 0);
    return `₹${paidAmount.toLocaleString('en-IN')} has been received from ${paidIncomes.length} paid entries.`;
  }

  // High amount queries
  if (lowerQuery.includes('more than') || lowerQuery.includes('greater than')) {
    const amountMatch = lowerQuery.match(/(?:more than|greater than)\s*₹?(\d+)/);
    if (amountMatch && appData.incomes) {
      const threshold = parseInt(amountMatch[1]);
      const highAmountIncomes = appData.incomes.filter(income => income.amount > threshold);

      if (lowerQuery.includes('table')) {
        let tableResponse = `Here are the entries with amounts more than ₹${threshold}:\n\n`;
        tableResponse += `| Name | Amount |\n|------|--------|\n`;
        highAmountIncomes.forEach(income => {
          tableResponse += `| ${income.name} | ₹${income.amount.toLocaleString('en-IN')} |\n`;
        });
        return tableResponse;
      } else {
        return `There are ${highAmountIncomes.length} entries with amounts more than ₹${threshold}.`;
      }
    }
  }

  return null;
};

const getHistoricalAnswer = async (query, historicalData) => {
  const lowerQuery = query.toLowerCase();
  
  // Extract year from query
  const yearMatch = lowerQuery.match(/20\d{2}/);
  if (!yearMatch) return null;
  
  const year = yearMatch[0];
  const yearData = historicalData.filter(data => data.recordYear === year);
  
  if (yearData.length === 0) return null;
  
  // Total income for specific year
  if (lowerQuery.includes('total income')) {
    const totalIncome = yearData.reduce((sum, data) => sum + (data.totals.income || 0), 0);
    return `The total income recorded for ${year} is ₹${totalIncome.toLocaleString('en-IN')}.`;
  }
  
  // Total expense for specific year
  if (lowerQuery.includes('total expense')) {
    const totalExpense = yearData.reduce((sum, data) => sum + (data.totals.expense || 0), 0);
    return `The total expenses recorded for ${year} is ₹${totalExpense.toLocaleString('en-IN')}.`;
  }
  
  return null;
};

const getComparisonAnswer = async (query, searchResults) => {
  const lowerQuery = query.toLowerCase();
  const years = (lowerQuery.match(/20\d{2}/g) || []).slice(0, 2);
  
  if (years.length < 2) return null;
  
  const [year1, year2] = years;
  
  // Get data for both years
  const year1Data = searchResults.historicalData.filter(data => data.recordYear === year1);
  const year2Data = searchResults.historicalData.filter(data => data.recordYear === year2);
  
  // Get current year data if one of the years matches current event
  const currentEvent = searchResults.appData.eventLabel?.label;
  let currentYearData = null;
  if (currentEvent && (currentEvent.includes(year1) || currentEvent.includes(year2))) {
    const currentYear = currentEvent.includes(year1) ? year1 : year2;
    if (currentYear === year1 || currentYear === year2) {
      currentYearData = {
        year: currentYear,
        income: searchResults.appData.incomes?.reduce((sum, income) => sum + income.amount, 0) || 0,
        expense: searchResults.appData.expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0
      };
    }
  }
  
  if (lowerQuery.includes('income')) {
    const income1 = currentYearData?.year === year1 ? 
      currentYearData.income : 
      year1Data.reduce((sum, data) => sum + (data.totals.income || 0), 0);
    
    const income2 = currentYearData?.year === year2 ? 
      currentYearData.income : 
      year2Data.reduce((sum, data) => sum + (data.totals.income || 0), 0);
    
    const difference = income2 - income1;
    const percentChange = income1 > 0 ? ((difference / income1) * 100).toFixed(1) : 0;
    
    let response = `**Income Comparison:**\n\n`;
    response += `| Year | Total Income (₹) |\n|------|------------------|\n`;
    response += `| ${year1} | ${income1.toLocaleString('en-IN')} |\n`;
    response += `| ${year2} | ${income2.toLocaleString('en-IN')} |\n\n`;
    response += `**Summary:**\n`;
    response += `The total income ${difference >= 0 ? 'increased' : 'decreased'} by ₹${Math.abs(difference).toLocaleString('en-IN')} from ${year1} to ${year2}, showing a ${Math.abs(percentChange)}% ${difference >= 0 ? 'increase' : 'decrease'}.`;
    
    return response;
  }
  
  return null;
};

const formatContextForLLM = (searchResults, query) => {
  let context = '';
  // Add current event label if available
  if (searchResults.appData.eventLabel) {
    context += `Current Event: ${searchResults.appData.eventLabel.label}\n\n`;
  }
  // Summarize all models dynamically
  for (const entry of ALL_MODELS) {
    const data = searchResults.appData[entry.name];
    if (Array.isArray(data) && data.length > 0) {
      // Show count and sample fields
      context += `\n${entry.name.charAt(0).toUpperCase() + entry.name.slice(1)}: ${data.length} entries.`;
      // Show totals for common fields
      if (data[0].amount !== undefined) {
        const total = data.reduce((sum, d) => sum + (d.amount || 0), 0);
        context += ` Total amount: ₹${total.toLocaleString('en-IN')}.`;
      }
      // Show unique names/contributors if present
      if (data[0].name) {
        const uniqueNames = [...new Set(data.map(i => i.name).filter(Boolean))];
        if (uniqueNames.length > 0) {
          context += ` Names: ${uniqueNames.join(', ')}.`;
        }
      }
      // Show a sample entry for Gemini to see structure
      context += ` Example: ${JSON.stringify(data[0])}`;
    }
  }
  // Add historical data context if present
  if (searchResults.historicalData.length > 0) {
    context += '\nHistorical Records:\n';
    searchResults.historicalData.forEach((record, index) => {
      context += `${index + 1}. ${record.fileName} (${record.recordYear}): ${record.text.substring(0, 300)}...\n`;
      if (record.totals.income > 0) {
        context += `   Total Income: ₹${record.totals.income.toLocaleString('en-IN')}\n`;
      }
      if (record.totals.expense > 0) {
        context += `   Total Expense: ₹${record.totals.expense.toLocaleString('en-IN')}\n`;
      }
      if (record.extractedFields?.length > 0) {
        context += `   Available Fields: ${record.extractedFields.join(', ')}\n`;
      }
    });
  }
  return context;
};

const getLLMResponse = async (query, context, complexity = 'simple', userName) => {
  try {
    // Use correct Gemini model names
    const model = complexity === 'complex'
      ? genAI.getGenerativeModel({ model: "gemini-1.5-pro" })
      : genAI.getGenerativeModel({ model: "gemini-1.5-flash" });


  const prompt = `You are VINI, the NBK Youth AI assistant. Answer the user's question naturally and accurately based on the provided context.

Context:
${context}

User Question: ${query}

Instructions:
- Be conversational and friendly, address the user as ${userName}
- Use Indian currency format (₹X,XXX)
- If showing tables, use proper markdown formatting with | separators
- For comparisons, show clear before/after or year-over-year data
- Keep responses concise but informative
- If data is not available, say so clearly
- Only mention that you were created by Kolli Vineeth if the user asks about your developer, creator, or origin
- For advice questions, provide practical suggestions based on the data context

Response:`;

    const result = await model.generateContent(prompt);
    return result.response.text();
  } catch (error) {
    console.error('LLM error:', error);
    return `I'm having trouble processing that question right now, ${userName}. Please try again.`;
  }
};