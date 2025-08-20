import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, Trash2, Bot } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';

function ViniChatWidget() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (user?.registerId) {
      fetchChatHistory();
    }
  }, [user]);

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    try {
      const { data } = await axios.get(`${API_URL}/api/vini/chat-history/${user.registerId}`);
      setChatHistory(data);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || isLoading) return;

    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    setIsTyping(true);

    // Add user message to chat immediately
    const newUserMessage = {
      message: userMessage,
      response: '',
      timestamp: new Date(),
      isUser: true
    };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/chat`, {
        message: userMessage,
        registerId: user.registerId
      });

      // Add VINI response
      const viniResponse = {
        message: userMessage,
        response: data.response,
        timestamp: new Date(),
        isUser: false
      };

      setChatHistory(prev => [...prev.slice(0, -1), viniResponse]);
    } catch (error) {
      toast.error('Failed to get response from VINI');
      setChatHistory(prev => prev.slice(0, -1)); // Remove the user message if failed
    } finally {
      setIsLoading(false);
      setIsTyping(false);
    }
  };

  const clearChatHistory = async () => {
    if (!window.confirm('Are you sure you want to clear chat history?')) return;

    try {
      await axios.delete(`${API_URL}/api/vini/chat-history/${user.registerId}`);
      setChatHistory([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear chat history');
    }
  };

  const formatMessage = (text) => {
    // Handle table formatting
    if (text.includes('|') && text.includes('---')) {
      const lines = text.split('\n');
      const tableLines = [];
      const otherLines = [];
      let inTable = false;

      lines.forEach(line => {
        if (line.includes('|') || line.includes('---')) {
          inTable = true;
          tableLines.push(line);
        } else if (inTable && line.trim() === '') {
          inTable = false;
        } else if (inTable) {
          tableLines.push(line);
        } else {
          otherLines.push(line);
        }
      });

      return (
        <div className="space-y-3">
          {otherLines.length > 0 && (
            <div className="whitespace-pre-wrap">{otherLines.join('\n')}</div>
          )}
          {tableLines.length > 0 && (
            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 text-sm">
                {tableLines.map((line, index) => {
                  if (line.includes('---')) return null;
                  const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
                  const isHeader = index === 0;
                  
                  return (
                    <tr key={index} className={isHeader ? 'bg-gray-100' : ''}>
                      {cells.map((cell, cellIndex) => (
                        isHeader ? (
                          <th key={cellIndex} className="border border-gray-300 px-3 py-2 font-medium text-left">
                            {cell}
                          </th>
                        ) : (
                          <td key={cellIndex} className="border border-gray-300 px-3 py-2">
                            {cell}
                          </td>
                        )
                      ))}
                    </tr>
                  );
                })}
              </table>
            </div>
          )}
        </div>
      );
    }

    // Handle regular text with markdown-like formatting
    return (
      <div className="whitespace-pre-wrap">
        {text.split('\n').map((line, index) => {
          if (line.startsWith('• ')) {
            return (
              <div key={index} className="flex items-start space-x-2 mb-1">
                <span className="text-indigo-600 font-bold">•</span>
                <span>{line.substring(2)}</span>
              </div>
            );
          }
          if (line.startsWith('**') && line.endsWith('**')) {
            return (
              <div key={index} className="font-bold mb-2">
                {line.substring(2, line.length - 2)}
              </div>
            );
          }
          return <div key={index} className="mb-1">{line}</div>;
        })}
      </div>
    );
  };

  return (
    <>
      {/* Floating Chat Icon */}
      <div
        className={`fixed bottom-24 right-4 z-50 transition-all duration-300 ${
          isOpen ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white rounded-full p-3 shadow-lg hover:shadow-xl transform hover:scale-110 transition-all duration-200"
        >
          <div className="flex items-center space-x-1">
            <span className="font-medium text-sm">VINI</span>
          </div>
        </button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 w-80 h-[500px] bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white p-4 rounded-t-lg flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-medium">VINI</span>
              <span className="font-medium">NBK Youth AI Assistant</span>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearChatHistory}
                className="text-white hover:text-gray-200"
                title="Clear chat history"
              >
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white hover:text-gray-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatHistory.length === 0 && (
              <div className="text-center text-gray-500 py-8">
                <Bot className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p className="text-sm">Hi! I'm VINI, your AI assistant.</p>
                <p className="text-xs">Ask me anything about your app data!</p>
              </div>
            )}
            
            {chatHistory.map((chat, index) => (
              <div key={index} className="space-y-2">
                {/* User Message */}
                <div className="flex justify-end">
                  <div className="bg-indigo-600 text-white rounded-lg px-3 py-2 max-w-xs">
                    <p className="text-sm">{chat.message}</p>
                  </div>
                </div>
                
                {/* VINI Response */}
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-3 py-2 max-w-xs">
                    <div className="flex items-center space-x-1 mb-1">
                      <Bot className="h-3 w-3 text-purple-600" />
                      <span className="text-xs font-medium text-purple-600">VINI</span>
                    </div>
                    <div className="text-sm text-gray-800">
                      {formatMessage(chat.response)}
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center space-x-1 mb-1">
                    <Bot className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-600">VINI</span>
                  </div>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t p-4">
            <form onSubmit={handleSendMessage} className="flex space-x-2">
              <input
                ref={inputRef}
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Ask VINI anything..."
                disabled={isLoading}
                className="flex-1 border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className="bg-indigo-600 text-white rounded-lg px-3 py-2 hover:bg-indigo-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ViniChatWidget;