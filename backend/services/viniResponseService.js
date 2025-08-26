import User from '../models/User.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import EventLabel from '../models/EventLabel.js';
import ProcessedChunk from '../models/ProcessedChunk.js';
import ProcessedRecord from '../models/ProcessedRecords.js';

export const getTimeBasedGreeting = () => {
  const now = new Date();
  const istTime = new Date(now.getTime() + (5.5 * 60 * 60 * 1000)); // IST offset
  const hour = istTime.getHours();
  
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

export const getCreativeGreeting = (userName) => {
  const greetings = [
    `${getTimeBasedGreeting()}, ${userName}! 🌟 Ready to explore your data?`,
    `Hey there, ${userName}! ${getTimeBasedGreeting()}! ✨ What can I help you discover today?`,
    `${getTimeBasedGreeting()}, ${userName}! 🚀 Let's dive into your NBK Youth data!`,
    `Hello ${userName}! ${getTimeBasedGreeting()}! 💫 I'm here to help with all your queries!`
  ];
  return greetings[Math.floor(Math.random() * greetings.length)];
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
  const creatorKeywords = ['who created you', 'who made you', 'who developed you', 'who built you', 'your creator', 'your developer', 'who created this', 'who made this app', 'who developed this website'];
  return creatorKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isNameQuestion = (message) => {
  const nameKeywords = ['what is my name', 'my name', 'who am i', 'what am i called'];
  return nameKeywords.some(keyword => message.toLowerCase().includes(keyword));
};

export const isCurrentEventQuestion = (message) => {
  const eventKeywords = ['current event', 'what event', 'event label', 'what data', 'show event data', 'present event'];
  return eventKeywords.some(keyword => message.toLowerCase().includes(keyword));
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