'use client';

import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Mic, 
  MicOff, 
  Volume2, 
  Brain, 
  Clock, 
  MapPin, 
  BookOpen, 
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface ComplianceQuery {
  id: string;
  query: string;
  regulation?: string;
  jurisdiction?: string;
  timeFrame?: string;
  timestamp: Date;
}

interface ComplianceResponse {
  id: string;
  queryId: string;
  answer: string;
  evidence: any[];
  confidence: number;
  sources: string[];
  dslGenerated?: string;
  decisionBundle?: any;
  visualization?: any;
  timestamp: Date;
}

interface VoiceResponse {
  voiceResponse: string;
  duration: number;
}

export function EnhancedComplianceCopilot() {
  const [query, setQuery] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isPlayingVoice, setIsPlayingVoice] = useState(false);
  const [conversations, setConversations] = useState<{query: ComplianceQuery, response: ComplianceResponse}[]>([]);
  const [selectedRegulation, setSelectedRegulation] = useState('');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState('');
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('');
  const [voiceResponse, setVoiceResponse] = useState<VoiceResponse | null>(null);
  
  const recognitionRef = useRef<any>(null);
  const synthesisRef = useRef<SpeechSynthesis | null>(null);

  useEffect(() => {
    // Initialize speech recognition
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = 'en-US';

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setQuery(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize speech synthesis
      synthesisRef.current = window.speechSynthesis;
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current && !isListening) {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  const processQuery = async () => {
    if (!query.trim()) return;

    setIsProcessing(true);
    
    const complianceQuery: ComplianceQuery = {
      id: `query-${Date.now()}`,
      query: query.trim(),
      regulation: selectedRegulation || undefined,
      jurisdiction: selectedJurisdiction || undefined,
      timeFrame: selectedTimeFrame || undefined,
      timestamp: new Date()
    };

    try {
      const response = await fetch('/api/compliance-copilot/query', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...complianceQuery,
          userId: 'demo-user'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setConversations(prev => [...prev, {
          query: complianceQuery,
          response: data.response
        }]);
        setQuery('');
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      console.error('Error processing query:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateVoiceResponse = async (text: string) => {
    try {
      const response = await fetch('/api/compliance-copilot/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: text,
          userId: 'demo-user'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setVoiceResponse(data.voiceResponse);
        
        // Play voice response
        if (synthesisRef.current) {
          const utterance = new SpeechSynthesisUtterance(data.voiceResponse);
          utterance.onstart = () => setIsPlayingVoice(true);
          utterance.onend = () => setIsPlayingVoice(false);
          synthesisRef.current.speak(utterance);
        }
      }
    } catch (error) {
      console.error('Error generating voice response:', error);
    }
  };

  const playVoiceResponse = (text: string) => {
    if (synthesisRef.current) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onstart = () => setIsPlayingVoice(true);
      utterance.onend = () => setIsPlayingVoice(false);
      synthesisRef.current.speak(utterance);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <CheckCircle className="h-4 w-4 text-green-600" />;
    if (confidence >= 0.6) return <AlertCircle className="h-4 w-4 text-yellow-600" />;
    return <AlertCircle className="h-4 w-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Brain className="h-5 w-5" />
            <span>Context-Aware Compliance Copilot</span>
            <Badge variant="secondary">Natural Language</Badge>
          </CardTitle>
          <CardDescription>
            Ask compliance questions in plain English and get instant, regulation-specific answers
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Regulation</label>
              <select
                value={selectedRegulation}
                onChange={(e) => setSelectedRegulation(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Any Regulation</option>
                <option value="Basel III">Basel III</option>
                <option value="GDPR">GDPR</option>
                <option value="BSA/AML">BSA/AML</option>
                <option value="FATF">FATF</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Jurisdiction</label>
              <select
                value={selectedJurisdiction}
                onChange={(e) => setSelectedJurisdiction(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Any Jurisdiction</option>
                <option value="US">United States</option>
                <option value="EU">European Union</option>
                <option value="Germany">Germany</option>
                <option value="UK">United Kingdom</option>
                <option value="Global">Global</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Time Frame</label>
              <select
                value={selectedTimeFrame}
                onChange={(e) => setSelectedTimeFrame(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="">Any Time</option>
                <option value="last quarter">Last Quarter</option>
                <option value="2023">2023</option>
                <option value="2024">2024</option>
                <option value="last 30 days">Last 30 Days</option>
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Actions</label>
              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant={isListening ? "destructive" : "outline"}
                  onClick={isListening ? stopListening : startListening}
                  disabled={isProcessing}
                >
                  {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generateVoiceResponse(query)}
                  disabled={!query.trim() || isProcessing}
                >
                  <Volume2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="flex space-x-2">
            <Input
              placeholder="Ask a compliance question... (e.g., 'Show Basel III liquidity checks for Germany last quarter')"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && processQuery()}
              disabled={isProcessing}
              className="flex-1"
            />
            <Button
              onClick={processQuery}
              disabled={!query.trim() || isProcessing}
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageSquare className="h-4 w-4" />}
              {isProcessing ? 'Processing...' : 'Ask'}
            </Button>
          </div>

          {isListening && (
            <Alert>
              <AlertDescription>
                🎤 Listening... Speak your compliance question clearly
              </AlertDescription>
            </Alert>
          )}

          {isPlayingVoice && (
            <Alert>
              <AlertDescription>
                🔊 Playing voice response...
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {conversations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Compliance Conversations</CardTitle>
            <CardDescription>
              Your compliance Q&A history with evidence trails
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-96">
              <div className="space-y-4">
                {conversations.map((conversation, index) => (
                  <div key={conversation.query.id} className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <div className="bg-primary text-primary-foreground rounded-full p-2">
                        <MessageSquare className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">You</span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.query.timestamp.toLocaleTimeString()}
                          </span>
                          {conversation.query.regulation && (
                            <Badge variant="outline" className="text-xs">
                              <BookOpen className="h-3 w-3 mr-1" />
                              {conversation.query.regulation}
                            </Badge>
                          )}
                          {conversation.query.jurisdiction && (
                            <Badge variant="outline" className="text-xs">
                              <MapPin className="h-3 w-3 mr-1" />
                              {conversation.query.jurisdiction}
                            </Badge>
                          )}
                          {conversation.query.timeFrame && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />
                              {conversation.query.timeFrame}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{conversation.query.query}</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-3">
                      <div className="bg-green-600 text-white rounded-full p-2">
                        <Brain className="h-4 w-4" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium">Glassbox AI</span>
                          <span className="text-xs text-muted-foreground">
                            {conversation.response.timestamp.toLocaleTimeString()}
                          </span>
                          <div className="flex items-center space-x-1">
                            {getConfidenceIcon(conversation.response.confidence)}
                            <span className={`text-xs ${getConfidenceColor(conversation.response.confidence)}`}>
                              {Math.round(conversation.response.confidence * 100)}% confidence
                            </span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => playVoiceResponse(conversation.response.answer)}
                            className="h-6 w-6 p-0"
                          >
                            <Volume2 className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-sm mb-3">{conversation.response.answer}</p>
                        
                        {conversation.response.sources.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium mb-1">Sources:</div>
                            <div className="flex flex-wrap gap-1">
                              {conversation.response.sources.map((source, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {source}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {conversation.response.evidence.length > 0 && (
                          <div className="mb-3">
                            <div className="text-xs font-medium mb-1">Evidence:</div>
                            <div className="space-y-1">
                              {conversation.response.evidence.map((evidence: any, idx: number) => (
                                <div key={idx} className="text-xs bg-muted p-2 rounded">
                                  <div className="flex items-center space-x-2">
                                    <span className="font-medium">{evidence.description}</span>
                                    <Badge variant={evidence.status === 'PASS' ? 'default' : 'destructive'} className="text-xs">
                                      {evidence.status}
                                    </Badge>
                                  </div>
                                  <div className="text-muted-foreground">
                                    Value: {evidence.value} | Threshold: {evidence.threshold}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {conversation.response.dslGenerated && (
                          <details className="mb-3">
                            <summary className="text-xs font-medium cursor-pointer">Generated DSL</summary>
                            <pre className="text-xs bg-muted p-2 rounded mt-1 overflow-x-auto">
                              {conversation.response.dslGenerated}
                            </pre>
                          </details>
                        )}
                      </div>
                    </div>
                    
                    {index < conversations.length - 1 && (
                      <div className="border-t border-muted-foreground/20"></div>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      <Alert>
        <AlertDescription>
          <strong>Impact:</strong> Compliance teams experience "ChatGPT for Regulation" → huge stickiness. 
          CRO/CCO/Auditors can ask complex compliance questions in plain English and get instant, 
          evidence-backed answers with interactive visualizations for boardroom presentations.
        </AlertDescription>
      </Alert>
    </div>
  );
}