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
import jsPDF from 'jspdf';

const SECURITY_PHRASES = [
  "Segurança é a nossa prioridade número um.",
  "Dirija com cuidado, sua família te espera.",
  "A carga é importante, mas sua vida é essencial.",
  "Cumprir as normas de GR salva vidas."
];

export const AdminDashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<DriverData | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  // Busca histórico do Supabase
  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Erro ao buscar histórico:", error);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') fetchHistory();
  }, [activeTab]);

  // Lógica principal de processamento
  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      // Extrai os dados do texto usando o serviço Gemini
      const extractedData = await parseDriverLine(inputText);
      setParsedData(extractedData);
      
      // Gera um ID único para a URL
      const uniqueId = Math.random().toString(36).substring(2, 11).toUpperCase();

      // Salva no banco de dados Supabase
      const { error } = await supabase
        .from('contracts')
        .insert([{ 
          id: uniqueId, 
          data: extractedData, 
          status: 'pendente' 
        }]);

      if (error) throw error;

      // Gera o link final (Baseado na rota /sign/:id do seu App.tsx)
      const url = `${window.location.origin}/sign/${uniqueId}`;
      setGeneratedLink(url);
      
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar no banco. Verifique se a tabela "contracts" tem a coluna "data" tipo JSONB.');
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
    <div className="min-h-screen bg-zinc-50 flex flex-col lg:flex-row">
      {/* Sidebar - Identidade Visual AssinaGR */}
      <aside className="w-full lg:w-72 bg-[#1a1412] text-white p-8 flex flex-col">
        <div className="flex items-center gap-4 mb-12">
          <div className="w-12 h-12 bg-[#f27d26] rounded-2xl flex items-center justify-center">
            <ShieldCheck className="text-white w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-black">AssinaGR</h1>
            <p className="text-[10px] text-[#f27d26] font-bold uppercase">Risk Management</p>
          </div>
        </div>

        <nav className="space-y-3">
          <button onClick={() => setActiveTab('generate')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold ${activeTab === 'generate' ? 'bg-white text-black' : 'text-zinc-500'}`}>
            <LayoutDashboard className="w-5 h-5" /> Painel
          </button>
          <button onClick={() => setActiveTab('history')} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold ${activeTab === 'history' ? 'bg-white text-black' : 'text-zinc-500'}`}>
            <History className="w-5 h-5" /> Histórico
          </button>
        </nav>
      </aside>

      {/* Conteúdo Principal */}
      <main className="flex-1 p-8 lg:p-12">
        <header className="mb-12">
          <h2 className="text-4xl font-black text-[#1a1412] uppercase">{activeTab === 'generate' ? 'Novo Registro' : 'Histórico'}</h2>
          <p className="text-zinc-500">Importe dados para gerar links de assinatura digital.</p>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
              <h3 className="text-xl font-black mb-6 flex items-center gap-2">
                <Clipboard className="text-[#f27d26]" /> IMPORTAR DADOS
              </h3>
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Cole aqui os dados da planilha..."
                className="w-full h-48 p-6 rounded-3xl bg-zinc-50 border-2 border-zinc-100 focus:border-[#f27d26]/30 outline-none resize-none mb-6"
              />
              <button
                onClick={handleProcess}
                disabled={loading || !inputText.trim()}
                className="w-full py-5 bg-[#1a1412] text-white rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-4 hover:bg-black transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="animate-spin" /> : <><Truck /> PROCESSAR E GERAR LINK <ChevronRight /></>}
              </button>
            </div>
          </div>

          {/* Card do Link Gerado */}
          <div className="bg-white rounded-[2.5rem] p-8 shadow-xl border border-zinc-100">
            <h3 className="text-xl font-black mb-6 flex items-center gap-2">
              <LinkIcon className="text-amber-600" /> LINK DE ACESSO
            </h3>
            {generatedLink ? (
              <div className="text-center space-y-6">
                <div className="p-6 bg-zinc-50 rounded-3xl border-2 border-dashed border-[#f27d26]/20">
                  <p className="text-xs font-mono text-zinc-500 break-all mb-4">{generatedLink}</p>
                  <button onClick={copyToClipboard} className="flex items-center gap-2 mx-auto bg-[#f27d26] text-white px-6 py-2 rounded-full font-bold text-sm">
                    {copied ? <CheckCircle size={16}/> : <Copy size={16}/>} {copied ? 'Copiado!' : 'Copiar Link'}
                  </button>
                </div>
                <div className="bg-[#1a1412] p-4 rounded-2xl text-[10px] text-zinc-400">
                  O motorista deve abrir este link no celular para assinar o termo.
                </div>
              </div>
            ) : (
              <div className="h-48 flex flex-col items-center justify-center text-zinc-300">
                <Clock size={48} className="mb-2 opacity-20" />
                <p className="text-xs italic">Aguardando processamento...</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};