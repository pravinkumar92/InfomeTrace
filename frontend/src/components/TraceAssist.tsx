import { useState, useEffect, useRef } from 'react';
import type { FormEvent } from 'react';
import { askTraceAssist } from '../api/assist';

interface Props {
  entityType: string;
  entityId: string;
  containmentKitchenId?: string;
  isRecalled?: boolean;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const TraceAssist: React.FC<Props> = ({ entityType, entityId, containmentKitchenId, isRecalled }) => {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const synth = window.speechSynthesis;
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = SpeechRecognition ? new SpeechRecognition() : null;
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Reset conversation when investigation target changes
  useEffect(() => {
    setMessages([]);
    setQuestion('');
    if (synth) synth.cancel();
    setIsSpeaking(false);
  }, [entityType, entityId, containmentKitchenId, isRecalled]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    return () => {
      if (synth) synth.cancel();
      if (recognition && isListening) recognition.stop();
    };
  }, []);

  const handleAsk = async (q: string) => {
    if (!q.trim()) return;
    setQuestion('');
    setMessages(prev => [...prev, { role: 'user', content: q }]);
    setIsLoading(true);
    if (synth) synth.cancel();
    setIsSpeaking(false);

    try {
      const result = await askTraceAssist({
        question: q,
        entity_type: entityType,
        entity_id: entityId,
        containment_kitchen_id: containmentKitchenId
      });
      setMessages(prev => [...prev, { role: 'assistant', content: result.answer }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: "Trace Assist is temporarily unavailable. The live investigation graph remains available." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    handleAsk(question);
  };

  const toggleSpeak = (text: string) => {
    if (!synth) return;
    
    if (isSpeaking) {
      synth.cancel();
      setIsSpeaking(false);
    } else {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.onend = () => setIsSpeaking(false);
      setIsSpeaking(true);
      synth.speak(utterance);
    }
  };

  const toggleListen = () => {
    if (!recognition) return;
    
    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleAsk(transcript);
        setIsListening(false);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.onend = () => setIsListening(false);
      
      recognition.start();
      setIsListening(true);
    }
  };

  const quickQuestions = [
    "What happened?",
    "Why is this exposed?",
    "Who is affected?",
    "Where did it originate?"
  ];
  
  if (containmentKitchenId) {
    quickQuestions.push("What changes if I contain this here?");
  }
  
  if (isRecalled) {
    quickQuestions.push("Is the recall verified?");
  }

  return (
    <section className="bg-surface border-t-4 border-maroon p-6 border-x border-b border-ui-border">
      <div className="flex justify-between items-end border-b border-ui-border pb-3 mb-6">
        <div>
          <h2 className="text-sm font-bold text-ink tracking-widest uppercase">InfoMeTrace Trace Assist</h2>
          <p className="text-[10px] text-muted font-mono uppercase tracking-widest mt-1">Graph-Grounded Analysis</p>
        </div>
        {recognition && (
          <button 
            onClick={toggleListen}
            className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1 border ${isListening ? 'bg-critical text-white border-critical animate-pulse' : 'bg-canvas text-ink border-ui-border hover:bg-muted hover:text-white transition-colors'}`}
          >
            {isListening ? 'LISTENING...' : 'VOICE INPUT'}
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {quickQuestions.map(q => (
          <button 
            key={q}
            onClick={() => handleAsk(q)}
            disabled={isLoading}
            className="text-[10px] bg-canvas border border-ui-border hover:border-maroon hover:text-maroon text-ink px-3 py-1.5 uppercase font-bold tracking-widest disabled:opacity-50 transition-colors"
          >
            {q}
          </button>
        ))}
      </div>
      
      {messages.length > 0 && (
        <div className="mb-8 space-y-4 max-h-96 overflow-y-auto pr-4">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-4 border-l-2 ${msg.role === 'user' ? 'border-muted bg-canvas ml-8' : 'border-maroon bg-maroon-soft mr-8'}`}>
                  <div className="text-[10px] font-bold tracking-widest uppercase mb-2 font-mono text-muted">
                {msg.role === 'user' ? '> USER' : '> INFOMETRACE TRACE ASSIST'}
              </div>
              <div className="text-sm text-ink leading-relaxed" aria-live="polite">
                {msg.content}
              </div>
              
              {msg.role === 'assistant' && (
                <div className="mt-4 pt-3 border-t border-ui-border flex justify-between items-end">
                  <div>
                    <div className="text-[10px] font-bold text-muted tracking-widest uppercase">
                      SOURCE
                    </div>
                    <div className="text-[10px] font-bold font-mono text-maroon uppercase tracking-widest mt-1">
                      LIVE NEO4J GRAPH
                    </div>
                  </div>
                  <button 
                    onClick={() => toggleSpeak(msg.content)}
                    className={`text-[10px] font-bold tracking-widest uppercase px-3 py-1 border ${isSpeaking ? 'bg-maroon text-white border-maroon' : 'bg-canvas text-ink border-ui-border hover:bg-muted hover:text-white'}`}
                  >
                    {isSpeaking ? 'STOP AUDIO' : 'READ ALOUD'}
                  </button>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-3">
        <input 
          type="text" 
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="Ask anything about this investigation..."
          className="flex-1 bg-canvas border border-ui-border px-4 py-3 text-sm text-ink focus:outline-none focus:border-maroon rounded-none font-sans"
        />
        <button 
          type="submit" 
          disabled={isLoading || !question.trim()}
          className="bg-ink hover:bg-muted text-white font-bold text-[10px] px-6 py-3 uppercase tracking-widest disabled:opacity-50 transition-colors"
        >
          {isLoading ? 'ANALYZING...' : 'ASK →'}
        </button>
      </form>
    </section>
  );
};
