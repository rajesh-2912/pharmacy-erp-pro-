
import React, { useState, useRef, useEffect } from 'react';
import { getAiResponse } from '../services/geminiService';
import type { Message } from '../types';
import { useInventory } from '../context/InventoryContext';
import { SendHorizonal, Bot, User } from 'lucide-react';
import { nanoid } from 'nanoid';

const AIAssistant: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { medicines } = useInventory();
    const messagesEndRef = useRef<null | HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    useEffect(scrollToBottom, [messages]);

    const handleSend = async () => {
        if (!input.trim() || isLoading) return;

        const userMessage: Message = { id: nanoid(), text: input, sender: 'user' };
        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setIsLoading(true);
        
        let prompt = input;

        if (input.toLowerCase().includes('low stock') || input.toLowerCase().includes('running low')) {
            const lowStockMeds = medicines.filter(m => m.stock < 10);
            if(lowStockMeds.length > 0) {
                const context = `Context: Here are the medicines currently low in stock (less than 10 units): ${lowStockMeds.map(m => `${m.name} (${m.stock} units)`).join(', ')}.`;
                prompt = `${context}\n\nUser query: ${input}`;
            }
        }

        const aiText = await getAiResponse(prompt);
        const aiMessage: Message = { id: nanoid(), text: aiText, sender: 'ai' };
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
    };

    return (
        <div className="h-full flex flex-col bg-white dark:bg-slate-800 rounded-xl shadow-md">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">AI Assistant</h1>
                <p className="text-sm text-slate-500">Ask about drug interactions, side effects, or inventory status.</p>
            </div>

            <div className="flex-grow p-4 space-y-4 overflow-y-auto">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex items-start gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.sender === 'ai' && <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-white"><Bot size={20}/></div>}
                        <div className={`max-w-lg p-3 rounded-xl ${msg.sender === 'user' ? 'bg-primary-500 text-white rounded-br-none' : 'bg-slate-100 dark:bg-slate-700 rounded-bl-none'}`}>
                            <p className="text-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\n/g, '<br />') }} />
                        </div>
                         {msg.sender === 'user' && <div className="w-8 h-8 rounded-full bg-slate-600 flex items-center justify-center flex-shrink-0 text-white"><User size={20}/></div>}
                    </div>
                ))}
                {isLoading && (
                    <div className="flex items-start gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center flex-shrink-0 text-white"><Bot size={20}/></div>
                        <div className="max-w-lg p-3 rounded-xl bg-slate-100 dark:bg-slate-700 rounded-bl-none">
                            <div className="flex items-center space-x-1">
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
                                <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse"></span>
                            </div>
                        </div>
                    </div>
                )}
                 <div ref={messagesEndRef} />
            </div>

            <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="relative">
                    <input
                        type="text"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                        placeholder="Type your message..."
                        className="w-full p-3 pr-12 rounded-lg bg-slate-100 dark:bg-slate-700 border border-transparent focus:outline-none focus:ring-2 focus:ring-primary-500"
                        disabled={isLoading}
                    />
                    <button onClick={handleSend} disabled={isLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-primary-500 text-white hover:bg-primary-600 disabled:bg-slate-400">
                        <SendHorizonal size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AIAssistant;
