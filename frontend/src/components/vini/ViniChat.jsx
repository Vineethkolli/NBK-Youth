import { useState, useEffect, useRef } from 'react';
import { Send, X, Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../../utils/config';
import { useAuth } from '../../context/AuthContext';
import { formatDateTime } from '../../utils/dateTime';

function ViniChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [conversations, setConversations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      fetchChatHistory();
    }
  }, [isOpen]);

  useEffect(() => {
    scrollToBottom();
  }, [conversations]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchChatHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const { data } = await axios.get(`${API_URL}/api/vini/history`);
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch chat history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    const userMessage = query.trim();
    setQuery('');
    setIsLoading(true);

    // Add user message immediately
    const tempConversation = {
      userMessage,
      viniResponse: '',
      date: new Date(),
      responseTime: 0,
      isLoading: true
    };
    setConversations(prev => [...prev, tempConversation]);

    try {
      const { data } = await axios.post(`${API_URL}/api/vini/query`, {
        query: userMessage
      });

      // Update the conversation with VINI's response
      setConversations(prev => 
        prev.map((conv, index) => 
          index === prev.length - 1 
            ? {
                ...conv,
                viniResponse: data.response,
                responseTime: data.responseTime,
                dataSource: data.dataSource,
                isLoading: false
              }
            : conv
        )
      );
    } catch (error) {
      // Update with error message
      setConversations(prev => 
        prev.map((conv, index) => 
          index === prev.length - 1 
            ? {
                ...conv,
                viniResponse: "Sorry, I encountered an error. Please try again.",
                isLoading: false
              }
            : conv
        )
      );
      toast.error('Failed to get response from VINI');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!window.confirm('Are you sure you want to clear chat history?')) return;

    try {
      await axios.delete(`${API_URL}/api/vini/history`);
      setConversations([]);
      toast.success('Chat history cleared');
    } catch (error) {
      toast.error('Failed to clear chat history');
    }
  };

  const formatResponse = (response) => {
    // Handle table formatting
    if (response.includes('|') && response.includes('---')) {
      const lines = response.split('\n');
      const tableLines = [];
      let inTable = false;
      
      lines.forEach(line => {
        if (line.includes('|')) {
          inTable = true;
          tableLines.push(line);
        } else if (inTable && line.trim() === '') {
          inTable = false;
        } else if (!inTable) {
          tableLines.push(line);
        }
      });
      
      return tableLines.join('\n');
    }
    
    return response;
  };

  const renderMessage = (text) => {
    // Simple markdown-like formatting
    return text
      .split('\n')
      .map((line, index) => {
        // Handle table rows
        if (line.includes('|')) {
          const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);
          return (
            <div key={index} className="flex border-b border-gray-200">
              {cells.map((cell, cellIndex) => (
                <div key={cellIndex} className="flex-1 px-2 py-1 text-sm border-r border-gray-200 last:border-r-0">
                  {cell}
                </div>
              ))}
            </div>
          );
        }
        
        // Handle bullet points
        if (line.startsWith('•') || line.startsWith('-')) {
          return (
            <div key={index} className="flex items-start mb-1">
              <span className="text-indigo-600 mr-2">•</span>
              <span>{line.substring(1).trim()}</span>
            </div>
          );
        }
        
        // Handle bold text
        const boldText = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        
        return (
          <div key={index} className="mb-1" dangerouslySetInnerHTML={{ __html: boldText }} />
        );
      });
  };

  return (
    <>
      {/* Floating Chat Icon */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center z-50 animate-pulse"
        >
          <MessageCircle className="h-6 w-6" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
            <span className="text-xs font-bold text-white">V</span>
          </div>
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 w-96 h-[500px] bg-white rounded-lg shadow-2xl border border-gray-200 flex flex-col z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-t-lg">
            <div className="flex items-center">
              <div className="w-8 h-8 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-3">
                <span className="text-sm font-bold">V</span>
              </div>
              <div>
                <h3 className="font-semibold">VINI</h3>
                <p className="text-xs opacity-90">NBK Youth AI Assistant</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <button
                onClick={clearHistory}
                className="text-white hover:text-gray-200"
                title="Clear History"
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
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {isLoadingHistory ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center text-gray-500 mt-8">
                <MessageCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Hi {user?.name}! I'm VINI, your AI assistant.</p>
                <p className="text-sm mt-2">Ask me anything about your app data or historical records!</p>
              </div>
            ) : (
              conversations.map((conv, index) => (
                <div key={index} className="space-y-3">
                  {/* User Message */}
                  <div className="flex justify-end">
                    <div className="bg-indigo-600 text-white rounded-lg px-4 py-2 max-w-xs">
                      <p className="text-sm">{conv.userMessage}</p>
                    </div>
                  </div>

                  {/* VINI Response */}
                  <div className="flex justify-start">
                    <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
                      {conv.isLoading ? (
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                          <span className="text-sm text-gray-600">VINI is thinking...</span>
                        </div>
                      ) : (
                        <>
                          <div className="text-sm text-gray-800">
                            {renderMessage(conv.viniResponse)}
                          </div>
                          {conv.responseTime && (
                            <div className="text-xs text-gray-500 mt-2 flex items-center justify-between">
                              <span>{conv.responseTime}ms</span>
                              {conv.dataSource && (
                                <span className="capitalize">{conv.dataSource.replace('_', ' ')}</span>
                              )}
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 p-4">
            <form onSubmit={handleSubmit} className="flex space-x-2">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask VINI anything..."
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading || !query.trim()}
                className="bg-indigo-600 text-white rounded-lg px-4 py-2 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default ViniChat;