import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import EventLabel from '../models/EventLabel.js';
import Event from '../models/Event.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import ProcessedRecord from '../models/ProcessedRecords.js';
import ChatHistory from '../models/ChatHistory.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cosineSimilarity, generateEmbedding } from './embeddingService.js';


export const getTimeBasedGreeting = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000));
  const hour = istTime.getHours();

  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getCreativeGreeting = (userName) => {
  const greetings = [
    `${getTimeBasedGreeting()}, ${userName}! 🌟 Ready to explore app?`,
    `Hey there, ${userName}! ${getTimeBasedGreeting()}! ✨ What can I help you discover today?`,
    `${getTimeBasedGreeting()}, ${userName}! 🚀 Let's dive into NBK Youth app!`,
    `Hello ${userName}! ${getTimeBasedGreeting()}! 💫 I'm here to help with all your queries!`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
};

export const isGreeting = (message) => {
  const greetings = ['hi', 'hello', 'hey', 'good morning', 'good afternoon', 'good evening', 'namaste'];
  return greetings.some(greeting => new RegExp(`\\b${greeting}\\b`, 'i').test(message));
};

export const isIdentityQuestion = (message) => {
  const identityKeywords = ['who are you', 'what are you', 'who is vini', 'about you', 'introduce yourself'];
  return identityKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isCreatorQuestion = (message) => {
  const creatorKeywords = ['who created you', 'who developed this app', 'who made you', 'who developed you', 'who built you', 'your creator', 'your developer', 'who created this', 'who made this app', 'who developed this website'];
  return creatorKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isNameQuestion = (message) => {
  const nameKeywords = ['what is my name', 'my name', 'who am i', 'what am i called'];
  return nameKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isCurrentEventQuestion = (message) => {
  const msg = message.toLowerCase();
  // Exclude questions about upcoming/future events so they fall through to LLM
  if (msg.includes('coming up') || msg.includes('upcoming') || msg.includes('next event') || msg.includes('future event')) {
    return false;
  }
  const eventKeywords = ['current event', 'what event', 'event label', 'what data', 'show event data', 'present event'];
  return eventKeywords.some(keyword => msg.includes(keyword));
};

export const isStatsQuestion = (message) => {
  const msg = message.toLowerCase();
  const statsKeywords = ['stats', 'statistics', 'overview', 'summary', 'report', 'insights'];
  const yearPatterns = ['year stats', 'stats of', 'of this year', 'of the year'];
  
  const hasStatsKeyword = statsKeywords.some(keyword => msg.includes(keyword));
  const hasYearPattern = yearPatterns.some(pattern => msg.includes(pattern));
  
  return hasStatsKeyword || (hasYearPattern && msg.includes('year'));
};

export const isMyIncomesQuestion = (message) => {
  const incomeKeywords = ['my incomes', 'show my incomes', 'all my incomes', 'my payments', 'my contributions'];
  return incomeKeywords.some(keyword => message.toLowerCase().includes(keyword));
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

const formatCurrency = (value = 0) => {
  const numericValue = Number(value);
  const safeValue = Number.isNaN(numericValue) ? 0 : numericValue;
  return `₹${safeValue.toLocaleString('en-IN')}`;
};

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export const getCurrentStats = async () => {
  try {
    const [incomes, expenses, users] = await Promise.all([
      Income.find({ isDeleted: false }),
      Expense.find({ isDeleted: false }),
      User.find()
    ]);

    const totalIncome = incomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0);
    const totalExpense = expenses.reduce((sum, expense) => sum + (Number(expense.amount) || 0), 0);
    const paidIncomes = incomes.filter(income => income.status === 'paid');
    const amountReceived = paidIncomes.reduce((sum, income) => sum + (Number(income.amount) || 0), 0);

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
      }),
      Expense.find({
        isDeleted: false,
        $or: [
          { purpose: { $regex: query, $options: 'i' } },
          { name: { $regex: query, $options: 'i' } }
        ]
      }),
      User.find({
        $or: [
          { name: { $regex: query, $options: 'i' } },
          { registerId: { $regex: query, $options: 'i' } }
        ]
      })
    ]);

    return { incomes, expenses, users };
  } catch (error) {
    console.error('Error searching current data:', error);
    return {};
  }
};

/**
 * Robust name-based amount extraction from a text block.
 * Returns first matching numeric amount found on the same or adjacent lines as the name.
 */
const extractAmountForNameFromText = (chunkText, searchName) => {
  // split into lines and find lines mentioning the name
  const lines = chunkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const lcName = searchName.toLowerCase();
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i];
    if (l.toLowerCase().includes(lcName)) {
      // try to find ₹ or numeric amount on this line
      const amtMatch = l.match(/₹\s*([\d,\.]+)/) || l.match(/Amount:\s*₹?\s*([\d,\.]+)/i) || l.match(/([\d,]{2,})/);
      if (amtMatch) {
        const digitsOnly = amtMatch[1].replace(/[^\d]/g, '');
        if (digitsOnly) return Math.round(Number(digitsOnly));
      }
      // try previous and next line
      const prev = lines[i - 1] || '';
      const next = lines[i + 1] || '';
      const neighbor = [prev, next].join(' ');
      const nMatch = neighbor.match(/₹\s*([\d,\.]+)/) || neighbor.match(/Amount:\s*₹?\s*([\d,\.]+)/i);
      if (nMatch) {
        const digitsOnly = nMatch[1].replace(/[^\d]/g, '');
        if (digitsOnly) return Math.round(Number(digitsOnly));
      }
    }
  }
  return null;
};

/**
 * Extract structured income entries from chunk text using expected formatting.
 * Returns array of { name, amount }
 */
const extractIncomeLines = (chunkText) => {
  const lines = chunkText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const extracted = [];
  const regex = /Income ID:\s*([^,]+),\s*Name:\s*([^,]+),\s*Amount:\s*₹?\s*([\d,\.]+)/i;

  for (const l of lines) {
    const m = l.match(regex);
    if (m) {
      const name = m[2].trim();
      const amt = Number(m[3].replace(/[^\d]/g, '')) || 0;
      extracted.push({ name, amount: amt, raw: l });
    }
  }
  return extracted;
};

export const chatWithViniLogic = async ({ message, registerId }) => {
  const user = await User.findOne({ registerId });
  const userName = user?.name || 'User';
  let response = '';
  const msg = message.toLowerCase();

  try {
    // greetings / identity / creator / name / current event / my incomes 
    if (isGreeting(msg)) {
      response = getCreativeGreeting(userName);
    } else if (isIdentityQuestion(msg)) {
      response = `I'm VINI, your AI assistant! 🤖 Created and developed by Kolli Vineeth. 👨‍💻\n\nI'm here to help you explore and understand everything about the NBK Youth Gangavaram — current events, past celebrations, financial data, historical records, and much more!\n\nWhat would you like to know, ${userName}? ✨`;
    } else if (isCreatorQuestion(msg)) {
      response = `I was created and developed by Kolli Vineeth for the NBK Youth AI assistant. He developed this entire platform to help manage and track all your community activities! 👨‍💻`;
    } else if (isNameQuestion(msg)) {
      response = `Your name is ${userName}! 😊 Is there anything specific you'd like to know about your data or activities?`;
    } else if (isCurrentEventQuestion(msg) || isStatsQuestion(msg)) {
      const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
      const currentStats = await getCurrentStats();
      const eventName = eventLabel?.label || 'current records';
      const totalIncome = Number(currentStats.totalIncome) || 0;
      const totalExpense = Number(currentStats.totalExpense) || 0;
      const amountReceived = Number(currentStats.amountReceived) || 0;
      const amountLeft = totalIncome - totalExpense;

      let intro = '';
      if (eventLabel && isCurrentEventQuestion(msg)) {
        intro = `The current event is ${eventName}! 🎉\n\n`;
      } else if (!eventLabel) {
        intro = `No current event label is set. Here's the latest overview:\n\n`;
      }

      response = `${intro}Latest stats:\n`;
      response += `• Current Event: ${eventName}\n`;
      response += `• Total App Users: ${currentStats.totalUsers || 0}\n`;
      response += `• Total Income: ${formatCurrency(totalIncome)}\n`;
      response += `• Amount Received: ${formatCurrency(amountReceived)}\n`;
      response += `• Total Expenses: ${formatCurrency(totalExpense)}\n`;
      response += `• Amount Left: ${formatCurrency(amountLeft)}\n`;
    } else if (isMyIncomesQuestion(msg)) {
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
        response += `\n\nTotal: ${userIncomes.length} entries, Amount: ₹${userIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0).toLocaleString('en-IN')}`;
      } else {
        response = `No income records found for you in the current data, ${userName}.`;
      }
    }
    // Amount paid by specific person (current and historical)
    else if (msg.includes('amount paid') || msg.includes('contributed') || msg.includes('donated') || msg.includes('amount paid by')) {
      const nameMatch = message.match(/(?:amount paid by|contributed by|donated by)\s+([a-zA-Z\s]+)/i);
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);

      let searchName = nameMatch ? nameMatch[1].trim() : userName;

      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        const eventName = eventMatch ? eventMatch[1] : null;

        // Step 1: similarity retrieval across historical chunks (wider slice)
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        if (!historicalChunks || historicalChunks.length === 0) {
          response = `No historical chunks found for year ${year}.`;
        } else {
          const queryEmbedding = await generateEmbedding(message);
          const scored = historicalChunks.map(c => {
            const sim = (Array.isArray(c.embedding) && c.embedding.length > 0) ? cosineSimilarity(queryEmbedding, c.embedding) : -1;
            return { chunk: c, similarity: sim };
          }).sort((a, b) => b.similarity - a.similarity);

          // take top 20 for a second-stage filter
          const topCandidates = scored.slice(0, 20).map(s => s.chunk);

          // Prefer chunks that explicitly contain the person's name or have name in metadata
          let foundAmount = null;
          for (const candidate of topCandidates) {
            const candidateText = candidate.chunkText || candidate.text || '';
            // check metadata names / ids first
            const meta = candidate.metadata || {};
            const metaNames = (meta.names || []).map(n => n.toLowerCase());
            const hasNameInMeta = metaNames.includes(searchName.toLowerCase());
            if (hasNameInMeta || (candidateText.toLowerCase().includes(searchName.toLowerCase()))) {
              // try to extract amount near the name
              const amt = extractAmountForNameFromText(candidateText, searchName);
              if (amt !== null) {
                foundAmount = { amount: amt, eventName: candidate.eventName || candidate.metadata?.eventName || '?', year };
                break;
              }
            }
          }

          if (foundAmount) {
            response = `${searchName} paid ₹${foundAmount.amount.toLocaleString('en-IN')} for ${foundAmount.eventName} ${year}.`;
          } else {
            response = `No record found for ${searchName} in ${eventName ? eventName + ' ' : ''}${year}.`;
          }
        }
      } else {
        // current incomes simple DB query
        const currentIncomes = await Income.find({
          isDeleted: false,
          name: { $regex: searchName, $options: 'i' }
        });

        if (currentIncomes.length > 0) {
          const total = currentIncomes.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
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
      const topN = numberMatch ? parseInt(numberMatch[1], 10) : 3;
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);

      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        const eventName = eventMatch ? eventMatch[1] : null;
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });

        if (!historicalChunks || historicalChunks.length === 0) {
          response = `No historical data found for ${year}.`;
        } else {
          // similarity retrieval
          const queryEmbedding = await generateEmbedding(message);
          const scored = historicalChunks.map(c => {
            const sim = (Array.isArray(c.embedding) && c.embedding.length > 0) ? cosineSimilarity(queryEmbedding, c.embedding) : -1;
            return { chunk: c, similarity: sim };
          }).sort((a, b) => b.similarity - a.similarity);

          const topCandidates = scored.slice(0, 30).map(s => s.chunk); // take more and parse for incomes

          // Attempt to parse structured incomes from the candidates
          const allIncomes = [];
          for (const cand of topCandidates) {
            try {
              const found = extractIncomeLines(cand.chunkText || cand.text || '');
              found.forEach(f => {
                allIncomes.push({ ...f, eventName: cand.eventName || cand.metadata?.eventName || '', year: cand.year });
              });
            } catch (err) {
              // ignore parse errors
            }
          }

          // aggregate by name
          const aggregator = {};
          for (const inc of allIncomes) {
            const n = inc.name || 'Unknown';
            aggregator[n] = (aggregator[n] || 0) + (Number(inc.amount) || 0);
          }

          const sorted = Object.entries(aggregator).sort((a, b) => b[1] - a[1]).slice(0, topN);

          if (sorted.length > 0) {
            const tableData = sorted.map((row, idx) => [(idx + 1).toString(), row[0], `₹${row[1].toLocaleString('en-IN')}`]);
            response = `Top ${topN} contributors for ${eventName ? eventName + ' ' : ''}${year}:\n\n`;
            response += formatTableResponse(tableData, ['Rank', 'Name', 'Amount']);
          } else {
            response = `No top contributors found for ${eventName ? eventName + ' ' : ''}${year}.`;
          }
        }
      } else {
        // current top contributors
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
    // Context-aware totals
    else if (msg.includes('total income') || msg.includes('total expense')) {
      const isIncome = msg.includes('total income');
      const yearMatch = message.match(/\b(20\d{2})\b/);
      const eventMatch = message.match(/([a-zA-Z]+)\s*20\d{2}/);

      if (yearMatch) {
        const year = parseInt(yearMatch[0], 10);
        const historicalChunks = await ProcessedChunk.find({ status: 'ready', year });
        let found = false;

        for (const chunk of historicalChunks) {
          if (!eventMatch || (chunk.eventName && chunk.eventName.toLowerCase().includes(eventMatch[1].toLowerCase()))) {
            if (isIncome) {
              if (chunk.metadata && chunk.metadata.totalIncome) {
                response = `The total income for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalIncome?.toLocaleString('en-IN') || 'N/A'}.`;
              } else {
                response = `The total income for ${chunk.eventName} ${year} is not available in chunk metadata.`;
              }
            } else {
              if (chunk.metadata && chunk.metadata.totalExpense) {
                response = `The total expense for ${chunk.eventName} ${year} is ₹${chunk.metadata.totalExpense?.toLocaleString('en-IN') || 'N/A'}.`;
              } else {
                response = `The total expense for ${chunk.eventName} ${year} is not available in chunk metadata.`;
              }
            }
            found = true;
            break;
          }
        }
        if (!found) {
          response = `No historical ${isIncome ? 'income' : 'expense'} data found for ${eventMatch ? eventMatch[1] + ' ' : ''}${year}.`;
        }
      } else {
        const currentStats = await getCurrentStats();
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const eventContext = eventLabel ? `for ${eventLabel.label}` : 'for the current event';
        if (isIncome) {
          response = `The total income ${eventContext} is ₹${currentStats.totalIncome?.toLocaleString('en-IN') || '0'}.`;
        } else {
          response = `The total expense ${eventContext} is ₹${currentStats.totalExpense?.toLocaleString('en-IN') || '0'}.`;
        }
      }
    }
    // Fallback - LLM assisted using current + historical context
    else {
      try {
        let queryEmbedding;
        try {
          queryEmbedding = await generateEmbedding(message);
        } catch (embErr) {
          console.error('Embedding generation failed:', embErr.message);
          queryEmbedding = [];
        }

        const currentStats = await getCurrentStats();
        const eventLabel = await EventLabel.findOne().sort({ createdAt: -1 });
        const events = await Event.find().sort({ dateTime: -1 }).limit(10);
        const historicalChunks = await ProcessedChunk.find({ status: 'ready' });
        const processedRecords = await ProcessedRecord.find({ status: 'ready' });

        const similarities = historicalChunks.map(chunk => {
          const emb = chunk.embedding || [];
          return {
            ...chunk.toObject(),
            similarity: (Array.isArray(emb) && emb.length > 0 && queryEmbedding.length > 0) ? cosineSimilarity(queryEmbedding, emb) : -1
          };
        }).sort((a, b) => b.similarity - a.similarity).slice(0, 10);

        let context = `You are VINI, NBK Youth AI assistant. Answer based on this data:\n\n`;

        if (eventLabel) {
          context += `Current Event: ${eventLabel.label}\n`;
        }

        if (events.length > 0) {
          context += `Scheduled/Upcoming Events:\n`;
          events.forEach(e => {
            context += `- ${e.name} on ${new Date(e.dateTime).toDateString()}\n`;
          });
          context += '\n';
        }

        context += `Current Stats: Total Income: ₹${currentStats.totalIncome?.toLocaleString('en-IN')}, Total Expense: ₹${currentStats.totalExpense?.toLocaleString('en-IN')}, Amount Received: ₹${currentStats.amountReceived?.toLocaleString('en-IN')}, Users: ${currentStats.totalUsers}, Income Entries: ${currentStats.incomeCount}, Expense Entries: ${currentStats.expenseCount}\n\n`;

        if (processedRecords.length > 0) {
          context += `Available Historical Events:\n`;
          processedRecords.forEach(record => {
            context += `- ${record.eventName} ${record.year} (${(record.selectedCollections || []).join(', ')})\n`;
          });
          context += '\n';
        }

        if (similarities.length > 0) {
          context += `Historical Data (most relevant chunks):\n`;
          similarities.forEach(chunk => {
            context += `${chunk.eventName || chunk.metadata?.eventName || ''} ${chunk.year || ''}: ${chunk.chunkText?.substring(0, 400) || chunk.text?.substring(0,400)}...\n\n`;
          });
        }

        context += `\nUser Question: ${message}\n\nUser asking: ${userName} (${registerId})\n\nProvide a helpful, natural response as VINI. Keep it concise and friendly. If you mention amounts, use Indian number formatting with ₹ symbol.`;

        let result;
        try {
          // Try primary model: gemini-2.5-flash-lite
          const modelLite = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
          result = await modelLite.generateContent(context);
          if (!result || !result.response) {
            throw new Error('Invalid response from Gemini Flash Lite');
          }
          response = result.response.text();
        } catch (liteError) {
          console.warn('Gemini Flash Lite failed, switching to Flash:', liteError.message);
          try {
            // Try fallback model: gemini-2.5-flash
            const modelFlash = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
            result = await modelFlash.generateContent(context);
            if (!result || !result.response) {
              throw new Error('Invalid response from Gemini Flash');
            }
            response = result.response.text();
          } catch (flashError) {
            console.error('Gemini API Error (both models failed):', flashError.message);
            // Fallback response when Gemini fails
            response = `I'm still learning to answer that type of question! 🤔 Try asking about:\n\n• Current event details\n• Total income/expenses\n• Top contributors\n• Specific person's contributions\n• Your income records\n\nOr ask about any specific year like "Sankranti 2024" for historical data!`;
          }
        }
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
