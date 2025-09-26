'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  MessageSquare, 
  Bot, 
  User, 
  Send, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle,
  Clock,
  FileText,
  Search,
  Lightbulb,
  Shield,
  Zap,
  Brain,
  TrendingUp,
  Target,
  BookOpen
} from 'lucide-react';

interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string;
  attachments?: any[];
  suggestions?: string[];
}

interface ComplianceTask {
  id: string;
  title: string;
  description: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'REVIEW_REQUIRED';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  assignedTo: 'HUMAN' | 'AGENT' | 'COLLABORATIVE';
  progress: number;
  estimatedTime: string;
  actualTime?: string;
  createdAt: string;
  updatedAt: string;
  suggestions?: string[];
}

interface Insight {
  id: string;
  type: 'RISK' | 'OPPORTUNITY' | 'COMPLIANCE' | 'OPTIMIZATION';
  title: string;
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  confidence: number;
  actionable: boolean;
  category: string;
  timestamp: string;
}

export function ComplianceCopilot() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tasks, setTasks] = useState<ComplianceTask[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    fetchTasks();
    fetchInsights();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch('/api/copilot/messages');
      if (response.ok) {
        const data = await response.json();
        setMessages(data.messages);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchTasks = async () => {
    try {
      const response = await fetch('/api/copilot/tasks');
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const fetchInsights = async () => {
    try {
      const response = await fetch('/api/copilot/insights');
      if (response.ok) {
        const data = await response.json();
        setInsights(data.insights);
      }
    } catch (error) {
      console.error('Error fetching insights:', error);
    }
  };

  const sendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage: ChatMessage = {
      id: `msg_${Date.now()}`,
      type: 'user',
      content: inputMessage,
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/copilot/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: inputMessage,
          context: {
            activeTasks: tasks.filter(t => t.status !== 'COMPLETED').length,
            recentInsights: insights.length
          }
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const assistantMessage: ChatMessage = {
          id: `msg_${Date.now() + 1}`,
          type: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          suggestions: data.suggestions || []
        };
        setMessages(prev => [...prev, assistantMessage]);
        
        // Refresh tasks and insights as they might have been updated
        await fetchTasks();
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: ChatMessage = {
        id: `msg_${Date.now() + 1}`,
        type: 'assistant',
        content: 'I apologize, but I encountered an error while processing your request. Please try again.',
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateTaskStatus = async (taskId: string, status: string) => {
    try {
      const response = await fetch(`/api/copilot/tasks/${taskId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });

      if (response.ok) {
        await fetchTasks();
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const generateInsights = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/copilot/insights/generate', {
        method: 'POST',
      });

      if (response.ok) {
        await fetchInsights();
      }
    } catch (error) {
      console.error('Error generating insights:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED': return 'text-green-600';
      case 'IN_PROGRESS': return 'text-blue-600';
      case 'REVIEW_REQUIRED': return 'text-yellow-600';
      case 'PENDING': return 'text-gray-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED': return <Badge className="bg-green-600">Completed</Badge>;
      case 'IN_PROGRESS': return <Badge className="bg-blue-600">In Progress</Badge>;
      case 'REVIEW_REQUIRED': return <Badge className="bg-yellow-600">Review Required</Badge>;
      case 'PENDING': return <Badge className="bg-gray-600">Pending</Badge>;
      default: return <Badge className="bg-gray-600">Unknown</Badge>;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600';
      case 'HIGH': return 'text-orange-600';
      case 'MEDIUM': return 'text-yellow-600';
      case 'LOW': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'RISK': return <AlertCircle className="w-5 h-5 text-red-600" />;
      case 'OPPORTUNITY': return <TrendingUp className="w-5 h-5 text-green-600" />;
      case 'COMPLIANCE': return <Shield className="w-5 h-5 text-blue-600" />;
      case 'OPTIMIZATION': return <Zap className="w-5 h-5 text-yellow-600" />;
      default: return <Lightbulb className="w-5 h-5 text-gray-600" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Compliance Copilot</h1>
          <p className="text-muted-foreground">
            AI-powered collaboration between humans and agents for compliance management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={generateInsights} disabled={isLoading}>
            <Brain className="w-4 h-4 mr-2" />
            Generate Insights
          </Button>
          <Button variant="outline" onClick={() => { fetchTasks(); fetchInsights(); }}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Tasks</CardTitle>
            <Target className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{tasks.filter(t => t.status !== 'COMPLETED').length}</div>
            <p className="text-xs text-muted-foreground">Tasks in progress</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
            <CheckCircle className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'COMPLETED').length / tasks.length) * 100) : 0}%
            </div>
            <p className="text-xs text-muted-foreground">Tasks completed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Insights</CardTitle>
            <Lightbulb className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{insights.length}</div>
            <p className="text-xs text-muted-foreground">AI-generated insights</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.3s</div>
            <p className="text-xs text-muted-foreground">Assistant response</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="chat">Chat Interface</TabsTrigger>
          <TabsTrigger value="tasks">Collaborative Tasks</TabsTrigger>
          <TabsTrigger value="insights">AI Insights</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Compliance Assistant Chat
              </CardTitle>
              <CardDescription>
                Ask questions, request analysis, or collaborate on compliance tasks
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col">
              <ScrollArea className="flex-1 pr-4">
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
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Bot className="w-4 h-4 text-blue-600" />
                          </div>
                        </div>
                      )}
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.type === 'user'
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        {message.suggestions && message.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            <p className="text-xs font-medium">Suggestions:</p>
                            {message.suggestions.map((suggestion, index) => (
                              <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                className="text-xs w-full justify-start"
                                onClick={() => setInputMessage(suggestion)}
                              >
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                        <p className="text-xs opacity-70 mt-1">
                          {new Date(message.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {message.type === 'user' && (
                        <div className="flex-shrink-0">
                          <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-blue-600" />
                        </div>
                      </div>
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>
              <div className="mt-4 flex gap-2">
                <Textarea
                  placeholder="Ask about compliance requirements, request analysis, or collaborate on tasks..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="flex-1 resize-none"
                  rows={2}
                />
                <Button onClick={sendMessage} disabled={isLoading || !inputMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tasks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {tasks.map((task) => (
              <Card key={task.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <CardDescription className="mt-1">{task.description}</CardDescription>
                    </div>
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(task.status)}
                      <Badge variant="outline" className={getPriorityColor(task.priority)}>
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <Target className="w-4 h-4" />
                        <span>Assigned to: {task.assignedTo}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{task.estimatedTime}</span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{task.progress}%</span>
                      </div>
                      <Progress value={task.progress} className="w-full" />
                    </div>

                    {task.suggestions && task.suggestions.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-1">AI Suggestions:</p>
                        <div className="space-y-1">
                          {task.suggestions.slice(0, 2).map((suggestion, index) => (
                            <div key={index} className="text-xs bg-muted p-2 rounded">
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      {task.status === 'PENDING' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTaskStatus(task.id, 'IN_PROGRESS')}
                        >
                          Start Task
                        </Button>
                      )}
                      {task.status === 'IN_PROGRESS' && (
                        <Button 
                          size="sm" 
                          onClick={() => updateTaskStatus(task.id, 'COMPLETED')}
                        >
                          Complete
                        </Button>
                      )}
                      {task.status === 'COMPLETED' && (
                        <Button variant="outline" size="sm">
                          <FileText className="w-4 h-4 mr-1" />
                          View Report
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {insights.map((insight) => (
              <Card key={insight.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getInsightIcon(insight.type)}
                      <div className="flex-1">
                        <CardTitle className="text-lg">{insight.title}</CardTitle>
                        <CardDescription className="mt-1">{insight.description}</CardDescription>
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <Badge variant="outline">{insight.category}</Badge>
                      <Badge variant={insight.actionable ? 'default' : 'secondary'}>
                        {insight.actionable ? 'Actionable' : 'Informational'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        <span>Impact: {insight.impact}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Brain className="w-4 h-4" />
                        <span>Confidence: {insight.confidence}%</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{new Date(insight.timestamp).toLocaleString()}</span>
                      </div>
                    </div>

                    {insight.actionable && (
                      <Button variant="outline" size="sm" className="w-full">
                        <Target className="w-4 h-4 mr-1" />
                        Create Action Plan
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Task Performance</CardTitle>
                <CardDescription>
                  Collaborative task completion metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Human-Led Tasks</span>
                      <span>75% completion</span>
                    </div>
                    <Progress value={75} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Agent-Led Tasks</span>
                      <span>92% completion</span>
                    </div>
                    <Progress value={92} className="w-full" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Collaborative Tasks</span>
                      <span>88% completion</span>
                    </div>
                    <Progress value={88} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Insight Impact</CardTitle>
                <CardDescription>
                  Measurable impact of AI-generated insights
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-green-600">23</div>
                      <div className="text-xs text-muted-foreground">Risks Mitigated</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-600">15</div>
                      <div className="text-xs text-muted-foreground">Opportunities Found</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Average Confidence</span>
                      <span>87%</span>
                    </div>
                    <Progress value={87} className="w-full" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}