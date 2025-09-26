'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  BarChart3, 
  FileText, 
  Search,
  Mic,
  MicOff,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  data?: any;
  visualization?: any;
  confidence?: number;
}

interface QuerySuggestion {
  category: string;
  queries: string[];
}

interface Regulation {
  name: string;
  description: string;
  metrics: string[];
  jurisdictions: string[];
}

export default function EnhancedComplianceCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      type: 'assistant',
      content: 'Hello! I\'m your Compliance Copilot. I can help you query compliance data, analyze trends, generate reports, and validate regulatory requirements. What would you like to know?',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<QuerySuggestion[]>([]);
  const [regulations, setRegulations] = useState<Regulation[]>([]);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchSuggestions();
    fetchRegulations();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchSuggestions = async () => {
    try {
      const response = await fetch('/api/copilot/nl-query?type=suggestions');
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  };

  const fetchRegulations = async () => {
    try {
      const response = await fetch('/api/copilot/nl-query?type=regulations');
      const data = await response.json();
      if (data.success) {
        setRegulations(data.regulations);
      }
    } catch (error) {
      console.error('Error fetching regulations:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputValue,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/nl-query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: inputValue })
      });

      const data = await response.json();
      
      if (data.success) {
        const assistantMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          type: 'assistant',
          content: data.result.answer,
          timestamp: new Date(),
          data: data.result.data,
          visualization: data.result.visualization,
          confidence: data.result.confidence
        };
        setMessages(prev => [...prev, assistantMessage]);
      } else {
        throw new Error(data.error || 'Failed to process query');
      }
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        type: 'assistant',
        content: `I apologize, but I encountered an error while processing your request: ${error.message}. Please try again.`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleSuggestionClick = (query: string) => {
    setInputValue(query);
  };

  const toggleVoiceInput = () => {
    if (isListening) {
      setIsListening(false);
      // Stop voice recognition
    } else {
      setIsListening(true);
      // Start voice recognition (would integrate with Web Speech API)
      setTimeout(() => {
        setIsListening(false);
        setInputValue('Show Basel III liquidity checks for Germany last quarter');
      }, 2000);
    }
  };

  const getConfidenceIcon = (confidence?: number) => {
    if (!confidence) return null;
    
    if (confidence >= 0.8) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (confidence >= 0.6) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <AlertTriangle className="w-4 h-4 text-red-600" />;
    }
  };

  const formatTimestamp = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
      {/* Chat Interface */}
      <div className="lg:col-span-3 flex flex-col">
        <Card className="flex-1 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Compliance Copilot
              <Badge variant="outline" className="ml-auto">
                Beta
              </Badge>
            </CardTitle>
            <CardDescription>
              Ask questions about compliance, regulations, and performance metrics in natural language
            </CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {message.type === 'assistant' && (
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                      </div>
                    )}
                    
                    <div
                      className={`max-w-[80%] rounded-lg p-3 ${
                        message.type === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <div className="flex-1">
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          
                          {message.confidence && (
                            <div className="flex items-center gap-1 mt-2">
                              {getConfidenceIcon(message.confidence)}
                              <span className="text-xs opacity-70">
                                Confidence: {(message.confidence * 100).toFixed(0)}%
                              </span>
                            </div>
                          )}
                          
                          {message.visualization && (
                            <Card className="mt-3">
                              <CardHeader className="pb-2">
                                <CardTitle className="text-sm flex items-center gap-2">
                                  <BarChart3 className="w-4 h-4" />
                                  {message.visualization.options?.title || 'Visualization'}
                                </CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="h-40 bg-muted/50 rounded flex items-center justify-center">
                                  <BarChart3 className="w-8 h-8 text-muted-foreground" />
                                  <span className="ml-2 text-sm text-muted-foreground">
                                    Chart visualization would appear here
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                        
                        {message.type === 'user' && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                              <User className="w-4 h-4 text-primary-foreground" />
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs opacity-50">
                          {formatTimestamp(message.timestamp)}
                        </span>
                        
                        {message.type === 'assistant' && message.data && (
                          <Button size="sm" variant="ghost" className="h-6 text-xs">
                            <FileText className="w-3 h-3 mr-1" />
                            Export
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex gap-3">
                    <div className="flex-shrink-0">
                      <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                    <div className="bg-muted rounded-lg p-3">
                      <div className="flex items-center gap-2">
                        <div className="animate-spin">
                          <Clock className="w-4 h-4" />
                        </div>
                        <span className="text-sm">Processing your query...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Input Area */}
            <div className="border-t p-4">
              <div className="flex gap-2">
                <div className="flex-1">
                  <Textarea
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyPress}
                    placeholder="Ask about compliance, regulations, or performance metrics..."
                    className="resize-none"
                    rows={2}
                    disabled={isLoading}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="icon"
                    variant={isListening ? "destructive" : "outline"}
                    onClick={toggleVoiceInput}
                    disabled={isLoading}
                  >
                    {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Sidebar */}
      <div className="space-y-4">
        {/* Query Suggestions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Search className="w-4 h-4" />
              Suggested Queries
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {suggestions.map((suggestion, index) => (
                  <div key={index}>
                    <h4 className="text-sm font-medium mb-2">{suggestion.category}</h4>
                    <div className="space-y-1">
                      {suggestion.queries.map((query, queryIndex) => (
                        <Button
                          key={queryIndex}
                          variant="ghost"
                          size="sm"
                          className="w-full justify-start text-xs h-auto p-2"
                          onClick={() => handleSuggestionClick(query)}
                        >
                          {query}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Supported Regulations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Supported Regulations
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3">
            <ScrollArea className="h-64">
              <div className="space-y-3">
                {regulations.map((regulation, index) => (
                  <div key={index} className="space-y-1">
                    <h4 className="text-sm font-medium">{regulation.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {regulation.description}
                    </p>
                    <div className="flex flex-wrap gap-1">
                      {regulation.metrics.slice(0, 3).map((metric, metricIndex) => (
                        <Badge key={metricIndex} variant="secondary" className="text-xs">
                          {metric}
                        </Badge>
                      ))}
                      {regulation.metrics.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{regulation.metrics.length - 3}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}