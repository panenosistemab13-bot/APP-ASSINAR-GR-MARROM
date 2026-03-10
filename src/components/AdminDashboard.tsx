import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, Link as LinkIcon, CheckCircle, Loader2, Copy, History, 
  LayoutDashboard, Search, FileText, Clock, CheckCircle2, AlertCircle, 
  Trash2, ShieldCheck, Truck, User, MapPin, Fingerprint, ChevronRight, Info
} from 'lucide-react';
import { parseDriverLine } from '../services/geminiService';
import { DriverData, Contract } from '../types';
import { supabase } from '../lib/supabase';
import { CHECKLIST_ITEMS } from '../constants';

export const AdminDashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [contracts, setContracts] = useState<Contract[]>([]);

  // Carrega o histórico de motoristas
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (!error) setContracts(data || []);
    } catch (err) {
      console.error("Erro ao carregar histórico", err);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setGeneratedLink(null);

    try {
      // 1. Extração de dados via Gemini Service
      const extracted = await parseDriverLine(inputText);
      
      // 2. Criação de ID único para o link
      const contractId = Math.random().toString(36).substring(2, 10).toUpperCase();

      // 3. Salvamento no Supabase
      // Importante: O campo 'data' deve ser tipo JSONB no banco
      const { error: dbError } = await supabase
        .from('contracts')
        .insert([{ 
          id: contractId, 
          data: extracted, 
          created_at: new Date().toISOString()
        }]);

      if (dbError) throw dbError;

      // 4. Sucesso: Gera o link de assinatura
      const url = `${window.location.origin}/sign/${contractId}`;
      setGeneratedLink(url);
      setInputText('');

    } catch (error: any) {
      console.error("Erro detalhado:", error);
      alert(`Erro: ${error.message || 'Falha ao salvar. Verifique se a coluna "data" existe na tabela contracts.'}`);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] text-zinc-100 flex flex-col lg:flex-row font-sans">
      {/* Sidebar */}
      <aside className="w-full lg:w-72 bg-[#1c1917] p-8 flex flex-col border-r border-white/5">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-[#f27d26] rounded-2xl flex items-center justify-center shadow-lg shadow-[#f27d26]/20">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter">AssinaGR</h1>
            <p className="text-[10px] text-[#f27d26] font-bold uppercase tracking-widest">Logistics Control</p>
          </div>
        </div>

        <nav className="space-y-2">
          <button 
            onClick={() => setActiveTab('generate')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'generate' ? 'bg-[#f27d26] text-white' : 'text-zinc-500 hover:bg-white/5'}`}
          >
            <LayoutDashboard size={20} /> Painel de Controle
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-[#f27d26] text-white' : 'text-zinc-500 hover:bg-white/5'}`}
          >
            <History size={20} /> Histórico de Termos
          </button>
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-12">
          <h2 className="text-4xl font-black uppercase tracking-tight text-white">
            {activeTab === 'generate' ? 'Novo Registro' : 'Histórico de Assinaturas'}
          </h2>
          <p className="text-zinc-500 mt-2 font-medium">Sistema de Gerenciamento de Riscos e Termos Digitais.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Coluna de Input */}
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-[#1c1917] rounded-[2.5rem] p-8 border border-white/5 shadow-2xl">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-[#f27d26]/10 rounded-lg">
                  <Clipboard className="text-[#f27d26]" size={20} />
                </div>
                <h3 className="text-lg font-bold uppercase tracking-wider">Importar Dados da Planilha</h3>
              </div>
              
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui a linha da sua planilha de transporte..."
                className="w-full h-48 p-6 rounded-3xl bg-[#0c0a09] border border-white/5 text-zinc-300 focus:border-[#f27d26]/50 outline-none transition-all resize-none mb-6 font-mono text-sm"
              />

              <button
                onClick={handleProcess}
                disabled={loading || !inputText.trim()}
                className="w-full py-5 bg-[#f27d26] hover:bg-[#d96a1f] disabled:opacity-50 text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg shadow-[#f27d26]/10"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Truck size={22} /> Gerar Link de Assinatura <ChevronRight size={22} /></>}
              </button>
            </div>
          </div>

          {/* Coluna do Link */}
          <div className="bg-[#1c1917] rounded-[2.5rem] p-8 border border-white/5 flex flex-col">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <LinkIcon className="text-blue-500" size={20} />
              </div>
              <h3 className="text-lg font-bold uppercase tracking-wider">Link de Assinatura</h3>
            </div>

            {generatedLink ? (
              <div className="flex-1 flex flex-col justify-center gap-6">
                <div className="p-8 bg-[#0c0a09] rounded-3xl border border-white/5 text-center">
                  <div className="w-16 h-16 bg-[#f27d26]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="text-[#f27d26]" size={32} />
                  </div>
                  <p className="text-sm font-bold text-zinc-400 mb-6 uppercase tracking-tighter">O link está pronto para envio!</p>
                  
                  <div className="p-4 bg-white/5 rounded-xl mb-4 overflow-hidden">
                    <p className="text-[10px] font-mono text-zinc-500 truncate">{generatedLink}</p>
                  </div>

                  <button 
                    onClick={copyToClipboard}
                    className="w-full py-3 bg-white text-black rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-zinc-200 transition-all"
                  >
                    {copied ? <CheckCircle size={18}/> : <Copy size={18}/>}
                    {copied ? 'Link Copiado!' : 'Copiar Link'}
                  </button>
                </div>
                
                <div className="flex items-start gap-3 p-4 bg-white/5 rounded-2xl">
                  <AlertCircle size={18} className="text-zinc-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                    Envie este link para o WhatsApp do motorista. Ele poderá assinar diretamente pelo celular usando a tela touch.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30">
                <Clock size={48} className="mb-4" />
                <p className="text-sm font-bold italic">Aguardando processamento<br/>de novos dados...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};