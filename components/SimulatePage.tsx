'use client';

import { useState, useRef, useEffect } from 'react';
import { generateScenarioWithAI, getSimulationResponse, getSimulationFeedback, Scenario, SimulateChatMessage, FeedbackResponse } from '@/services/geminiService';
import { Play, Send, RefreshCw, Ear, Star, Heart, Award, Shield, CheckCircle, Flag, Clock, ArrowLeft } from 'lucide-react';
import { ErrorMessage } from './common/Common';

interface SimulationHistoryItem {
  id: string;
  timestamp: number;
  scenario: Scenario;
  messages: SimulateChatMessage[];
  feedback: FeedbackResponse | null;
}

export function SimulatePage() {
  const [scenario, setScenario] = useState<Scenario | null>(null);
  const [messages, setMessages] = useState<SimulateChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingConfig, setLoadingConfig] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState<FeedbackResponse | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [history, setHistory] = useState<SimulationHistoryItem[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const saved = localStorage.getItem('simulateHistory');
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse simulate history", e);
      }
    }
  }, []);

  const saveToHistory = (s: Scenario, m: SimulateChatMessage[], f: FeedbackResponse | null) => {
    const newItem: SimulationHistoryItem = {
      id: s.title + Date.now().toString(),
      timestamp: Date.now(),
      scenario: s,
      messages: m,
      feedback: f
    };
    const updatedHistory = [newItem, ...history].slice(0, 15); // keep last 15
    setHistory(updatedHistory);
    localStorage.setItem('simulateHistory', JSON.stringify(updatedHistory));
  };

  const loadHistoryItem = (item: SimulationHistoryItem) => {
    setScenario(item.scenario);
    setMessages(item.messages);
    setFeedback(item.feedback);
    setError('');
  };

  const renderIcon = (name: string) => {
    switch (name) {
      case 'Ear': return <Ear className="w-8 h-8 text-indigo-500" />;
      case 'Star': return <Star className="w-8 h-8 text-yellow-500" />;
      case 'Heart': return <Heart className="w-8 h-8 text-rose-500" />;
      case 'Award': return <Award className="w-8 h-8 text-amber-500" />;
      case 'Shield': return <Shield className="w-8 h-8 text-emerald-500" />;
      case 'CheckCircle': return <CheckCircle className="w-8 h-8 text-teal-500" />;
      default: return <Award className="w-8 h-8 text-blue-500" />;
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, chatLoading]);

  const handleGenerateScenario = async () => {
    setLoadingConfig(true);
    setError('');
    setFeedback(null);
    try {
      const newScenario = await generateScenarioWithAI();
      setScenario(newScenario);
      const initialMessages: SimulateChatMessage[] = [
        { role: 'model', content: newScenario.initialMessageFromPatient }
      ];
      setMessages(initialMessages);
      saveToHistory(newScenario, initialMessages, null);
    } catch (err: any) {
      setError(err.message || 'Failed to generate scenario.');
    }
    setLoadingConfig(false);
  };

  const handleEndSession = async () => {
    if (!scenario || messages.length < 2) return;
    setIsEnding(true);
    setError('');
    try {
      const result = await getSimulationFeedback(scenario, messages);
      setFeedback(result);
      saveToHistory(scenario, messages, result);
    } catch (err: any) {
      setError(err.message || 'Failed to generate feedback.');
    }
    setIsEnding(false);
  };

  const handleSendMessage = async () => {
    if (!input.trim() || !scenario) return;
    
    const userMessage: SimulateChatMessage = { role: 'user', content: input };
    const newHistory = [...messages, userMessage];
    setMessages(newHistory);
    setInput('');
    setChatLoading(true);

    try {
      const patientResponse = await getSimulationResponse(scenario, newHistory);
      const finalHistory = [...newHistory, { role: 'model', content: patientResponse } as SimulateChatMessage];
      setMessages(finalHistory);
      saveToHistory(scenario, finalHistory, feedback);
    } catch (err) {
      const errHistory = [...newHistory, { role: 'model', content: "*The patient stares blankly. There seems to be an error connecting to them.*" } as SimulateChatMessage];
      setMessages(errHistory);
      saveToHistory(scenario, errHistory, feedback);
    }
    setChatLoading(false);
  };

  if (!scenario) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] min-h-[500px] px-4 text-center">
        <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">Patient Simulator</h1>
        <p className="text-gray-500 mb-8 max-w-lg leading-relaxed">
          Practice your patient counseling skills with our AI-powered simulator. 
          It generates realistic patient profiles and challenges you to interact 
          and provide the correct pharmaceutical advice.
        </p>
        <ErrorMessage message={error} />
        <button
          onClick={handleGenerateScenario}
          disabled={loadingConfig}
          className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-blue-400 font-bold text-sm tracking-wide transition-colors"
        >
          {loadingConfig ? (
            <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Play className="w-5 h-5 mr-2" />
          )}
          {loadingConfig ? 'GENERATING SCENARIO...' : 'START NEW SIMULATION'}
        </button>

        {history.length > 0 && (
          <div className="mt-12 w-full max-w-4xl text-left bg-white p-6 rounded-xl border border-[#DEE2E6] shadow-sm">
             <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-4 border-b pb-3">
               <Clock className="w-4 h-4 text-gray-400" /> Recent Sessions
             </h3>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {history.map(item => (
                  <button
                     key={item.id}
                     onClick={() => loadHistoryItem(item)}
                     className="text-left rounded-lg p-4 border border-gray-100 bg-gray-50 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                  >
                     <h4 className="font-bold text-gray-900 truncate">{item.scenario.title}</h4>
                     <p className="text-xs text-gray-500 mt-1 flex items-center justify-between">
                       <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                       {item.feedback ? (
                         <span className="text-emerald-600 font-semibold text-xs py-0.5 px-2 bg-emerald-50 rounded">Score: {item.feedback.score}</span>
                       ) : (
                         <span className="text-blue-600 font-semibold text-xs py-0.5 px-2 bg-blue-50 rounded">In Progress...</span>
                       )}
                     </p>
                  </button>
                ))}
             </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
      {/* Scenario Context Sidebar */}
      <div className="col-span-1 lg:col-span-4 flex flex-col gap-6 h-full">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-[#DEE2E6] flex flex-col">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DEE2E6]">
            <h2 className="text-lg font-bold flex items-center gap-2">Scenario Brief</h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Simulate</span>
          </div>
          
          <div className="space-y-6 flex-1">
            <div>
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Title</h4>
              <p className="text-gray-900 font-bold text-lg">{scenario.title}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">Description</h4>
              <p className="text-gray-700 text-sm leading-relaxed">{scenario.description}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
              <h4 className="text-xs font-bold text-blue-800 uppercase tracking-wider mb-2">Patient Profile</h4>
              <p className="text-blue-900 text-sm leading-relaxed">{scenario.patientProfile}</p>
            </div>
          </div>

          <button 
            onClick={() => { setScenario(null); setMessages([]); setFeedback(null); }}
            className="mt-6 w-full py-2.5 border border-blue-200 text-blue-700 bg-blue-50 text-sm font-bold rounded-lg hover:bg-blue-100 flex justify-center items-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> 
            BACK TO MENU
          </button>
        </div>
      </div>

      {/* Chat Interface / Feedback Area */}
      <div className="col-span-1 lg:col-span-8 bg-white rounded-xl shadow-sm border border-[#DEE2E6] flex flex-col overflow-hidden">
        
        <div className="flex justify-between items-center p-4 border-b border-[#DEE2E6] bg-white">
          <h2 className="text-lg font-bold flex items-center gap-2">Simulation Session</h2>
          {!feedback && messages.length > 1 && (
            <button 
              onClick={handleEndSession}
              disabled={isEnding || chatLoading}
              className="px-4 py-1.5 bg-red-50 text-red-600 border border-red-200 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors flex items-center disabled:opacity-50"
            >
              <Flag className="w-4 h-4 mr-2" />
              {isEnding ? 'EVALUATING...' : 'END SESSION'}
            </button>
          )}
        </div>

        {feedback ? (
          <div className="flex-1 p-6 overflow-y-auto bg-gray-50 flex flex-col">
            <div className="bg-white p-6 rounded-xl border border-[#DEE2E6] shadow-sm mb-6 text-center">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-2">Simulation Score</h3>
              <div className="text-5xl font-extrabold text-blue-600 mb-2">
                {feedback.score}<span className="text-2xl text-gray-400">/{feedback.maxScore}</span>
              </div>
              <p className="text-gray-600 font-medium">Session Complete. Great effort!</p>
            </div>

            {feedback.badgesEarned && feedback.badgesEarned.length > 0 && (
              <div className="mb-6">
                <h4 className="font-bold text-gray-900 border-b pb-2 mb-4 uppercase tracking-wide text-sm">Badges Earned</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {feedback.badgesEarned.map((badge, idx) => (
                    <div key={idx} className="bg-white p-4 rounded-xl border border-yellow-100 shadow-sm flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 border border-yellow-200">
                        {renderIcon(badge.icon)}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900">{badge.name}</h5>
                        <p className="text-sm text-gray-600 leaing-relaxed mt-1">{badge.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="bg-white p-5 rounded-xl border border-[#DEE2E6] shadow-sm">
                 <h4 className="font-bold text-emerald-700 uppercase tracking-wide text-sm mb-3 flex items-center gap-2"><CheckCircle className="w-4 h-4"/> Accuracy</h4>
                 <p className="text-sm text-gray-700 leading-relaxed mb-4">{feedback.accuracyFeedback}</p>
                 <h5 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Objectives Met</h5>
                 <ul className="list-disc pl-4 space-y-1">
                   {feedback.objectivesMet.map((obj, idx) => (
                     <li key={idx} className="text-sm text-gray-600">{obj}</li>
                   ))}
                 </ul>
              </div>
              <div className="bg-white p-5 rounded-xl border border-[#DEE2E6] shadow-sm">
                 <h4 className="font-bold text-rose-600 uppercase tracking-wide text-sm mb-3 flex items-center gap-2"><Heart className="w-4 h-4"/> Empathy</h4>
                 <p className="text-sm text-gray-700 leading-relaxed">{feedback.empathyFeedback}</p>
                 
                 <h4 className="font-bold text-gray-900 uppercase tracking-wide text-sm mb-3 mt-6 flex items-center gap-2"><Star className="w-4 h-4 text-amber-500"/> Areas to Improve</h4>
                 <p className="text-sm text-gray-700 leading-relaxed">{feedback.constructiveFeedback}</p>
              </div>
            </div>

            <button 
              onClick={handleGenerateScenario}
              className="mt-auto w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 transition-colors"
            >
              START NEW SIMULATION
            </button>
          </div>
        ) : (
          <>
            <div className="flex-1 p-6 overflow-y-auto bg-gray-50 space-y-6">
              {messages.map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    {msg.role === 'model' && (
                      <div className="flex gap-3 mb-2 items-center">
                        <div className="w-8 h-8 rounded-full bg-blue-200 flex items-center justify-center font-bold text-blue-800 text-xs shadow-sm">P</div>
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Patient</span>
                      </div>
                    )}
                    <div className={`p-4 text-sm shadow-sm leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tl-xl rounded-bl-xl rounded-br-xl' 
                        : 'bg-white border border-[#DEE2E6] text-gray-800 rounded-tr-xl rounded-br-xl rounded-bl-xl'
                    }`}>
                      {msg.content}
                    </div>
                    {msg.role === 'user' && (
                      <div className="flex justify-end mt-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">You</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {chatLoading && (
                <div className="flex justify-start">
                  <div className="bg-white border border-[#DEE2E6] rounded-tr-xl rounded-br-xl rounded-bl-xl p-4 text-gray-500 shadow-sm flex items-center text-sm font-medium">
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin text-blue-600" /> Patient is responding...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Input Area */}
            <div className="p-4 bg-white border-t border-[#DEE2E6]">
              <div className="flex gap-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type your response to the patient..."
                  className="flex-1 p-3 bg-gray-50 border border-[#DEE2E6] rounded-lg focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  disabled={chatLoading}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || chatLoading}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg shadow-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center justify-center font-bold transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
