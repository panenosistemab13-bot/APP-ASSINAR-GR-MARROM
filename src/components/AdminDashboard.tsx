import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Clipboard, 
  Link as LinkIcon, 
  CheckCircle, 
  Loader2, 
  Copy, 
  History, 
  LayoutDashboard, 
  Download,
  Search,
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  Trash2,
  ShieldCheck,
  Truck,
  User,
  MapPin,
  Calendar,
  ExternalLink,
  ChevronRight,
  Info,
  Fingerprint
} from 'lucide-react';
import { parseDriverLine } from '../services/geminiService';
import { DriverData, Contract } from '../types';
import { supabase } from '../lib/supabase';
import { CHECKLIST_ITEMS } from '../constants';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';
import jsPDF from 'jspdf';

const SECURITY_PHRASES = [
  "Segurança é a nossa prioridade número um.",
  "Dirija com cuidado, sua família te espera.",
  "A carga é importante, mas sua vida é essencial.",
  "Cumprir as normas de GR salva vidas.",
  "Atenção total no trânsito, zero acidentes.",
  "Sua integridade física vale mais que qualquer prazo.",
  "O Gerenciamento de Risco é seu maior aliado na estrada."
];

export const AdminDashboard: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [parsedData, setParsedData] = useState<DriverData | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'generate' | 'history'>('generate');
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState(0);

  const fetchHistory = async () => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('contracts')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setContracts(data || []);
    } catch (error) {
      console.error("Failed to fetch history", error);
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPhraseIndex((prev) => (prev + 1) % SECURITY_PHRASES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleProcess = async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    try {
      const data = await parseDriverLine(inputText);
      setParsedData(data);
      
      const id = Math.random().toString(36).substring(2, 15);
      const { error: supabaseError } = await supabase
        .from('contracts')
        .insert([{ id, data }]);

      if (!supabaseError) {
        const url = `${window.location.origin}/sign/${id}`;
        setGeneratedLink(url);
      } else {
        throw supabaseError;
      }
    } catch (error) {
      console.error(error);
      alert('Erro ao processar dados ou salvar no Supabase.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este registro?')) return;
    
    try {
      const { error } = await supabase
        .from('contracts')
        .delete()
        .eq('id', id);
        
      if (!error) {
        setContracts(contracts.filter(c => c.id !== id));
      } else {
        throw error;
      }
    } catch (error) {
      console.error("Failed to delete", error);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const generateChecklistContent = (doc: jsPDF, contract: Contract, startY: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = startY;

    // Header Section
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.rect(15, y, 180, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("3 CORAÇÕES", 20, y + 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("GERENCIAMENTO DE RISCOS E SEGUROS", 20, y + 14);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("CHECK-LIST PRESENCIAL VEICULAR", 190, y + 11, { align: 'right' });
    
    y += 25;

    // Driver & Vehicle Data
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.rect(20, y, 170, 25);
    doc.line(20, y + 6, 190, y + 6);
    
    doc.setFontSize(7);
    doc.text("DADOS DO MOTORISTA E VEÍCULO", pageWidth / 2, y + 4, { align: 'center' });
    
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const dataY = y + 10;
    doc.text(`MOTORISTA: ${contract.data.motorista || '-'}`, 25, dataY);
    doc.text(`CPF: ${contract.data.cpf || '-'}`, 85, dataY);
    doc.text(`RG: ${contract.data.rg || '-'}`, 145, dataY);

    doc.text(`CNH: ${contract.data.cnh || '-'}`, 25, dataY + 5);
    doc.text(`VÍNCULO: ${contract.data.vinculo || '-'}`, 85, dataY + 5);
    doc.text(`TRANSPORTADOR: ${contract.data.transportador || '-'}`, 145, dataY + 5);

    doc.text(`PLACA CAVALO: ${contract.data.cavalo || '-'}`, 25, dataY + 10);
    doc.text(`CARRETA I: ${contract.data.carreta || '-'}`, 85, dataY + 10);
    doc.text(`CARRETA II: ${contract.data.carreta2 || '-'}`, 145, dataY + 10);

    y += 30;

    // Checklist Table
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text("ITENS DE VISTORIA", 20, y);
    doc.text("STATUS", 175, y);
    y += 2;
    doc.line(20, y, 190, y);
    y += 4;

    const checklistItems = CHECKLIST_ITEMS;

    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    checklistItems.forEach((item, index) => {
      doc.text(`${index + 1}. ${item}`, 20, y);
      doc.text("[ X ] CONFORME", 165, y);
      y += 4;
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
    });

    y += 5;
    doc.setFont("helvetica", "bold");
    doc.text("APROVAÇÃO DO VEÍCULO: [ X ] APROVADO   [   ] REPROVADO", 20, y);

    if (contract.signature) {
      y += 10;
      try {
        doc.addImage(contract.signature, 'PNG', 75, y, 40, 15);
      } catch (e) {}
      y += 18;
      doc.line(60, y, 150, y);
      doc.text("(Assinatura do Motorista)", 105, y + 4, { align: 'center' });
    }

    return y;
  };

  const generateTermContent = (doc: jsPDF, contract: Contract, startY: number, title: string) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    let y = startY;

    // Header Section
    doc.setDrawColor(200);
    doc.setLineWidth(0.1);
    doc.rect(15, y, 180, 20);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text("3 CORAÇÕES", 20, y + 8);
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("GERENCIAMENTO DE RISCOS E SEGUROS", 20, y + 14);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text(title, 190, y + 11, { align: 'right' });
    
    y += 25;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text("TERMO DE RESPONSABILIDADE GR", pageWidth / 2, y, { align: 'center' });
    y += 8;
    
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    const introText = "Declaro para os devidos fins, que fui contratado(a) pela transportadora, cujos dados seguem abaixo, para efetuar o transporte de carga do embarcador TRÊS CORAÇÕES ALIMENTOS S.A., CAFÉ TRÊS CORAÇÕES S.A.";
    const splitIntro = doc.splitTextToSize(introText, 170);
    doc.text(splitIntro, 20, y);
    y += (splitIntro.length * 4) + 2;
    
    const bodyText = [
      "Estou ciente quanto às normas e procedimentos descritos nos itens a seguir. Confirmo que li e compreendi todas as regras repassadas quanto ao Gerenciamento de Riscos e me comprometo a cumpri-las em sua totalidade.",
      "Comprometo-me a entregar a carga ao destinatário, em iguais condições em que recebi. Além de, no decorrer do percurso, colher carimbo e assinatura em todos os Postos Fiscais.",
      "Estou ciente que, em caso de descumprimento das normas indicadas neste documento, poderei ser responsabilizado civil e criminalmente pelos danos causados à carga em caso de sinistro, estando eu em desacordo com as regras impostas a mim. Dessa forma, fica a critério do embarcador me bloquear ou não para carregamento através da Central de Gerenciamento de Riscos.",
      "Também estou ciente de que o veículo não pode ser retirado do local de descarga e/ou estacionamento sem autorização da Logística da Filial."
    ];

    bodyText.forEach(text => {
      const splitText = doc.splitTextToSize(text, 170);
      doc.text(splitText, 20, y);
      y += (splitText.length * 4);
    });
    y += 2;

    // Data Table
    doc.setDrawColor(100);
    doc.setLineWidth(0.2);
    doc.setFillColor(245, 245, 245);
    doc.rect(20, y, 170, 30, 'FD');
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.text("DADOS DA VIAGEM:", pageWidth / 2, y + 4, { align: 'center' });
    doc.line(20, y + 6, 190, y + 6);
    
    doc.setFontSize(6);
    const dataY = y + 11;
    doc.text(`DATA: ${new Date(contract.created_at).toLocaleDateString('pt-BR')}`, 25, dataY);
    doc.text(`CPF: ${contract.data.cpf || '-'}`, 85, dataY);
    doc.text(`TRANSPORTADORA: ${contract.data.transportador || '-'}`, 145, dataY);

    doc.text(`MOTORISTA: ${contract.data.motorista || '-'}`, 25, dataY + 6);
    doc.text(`VÍNCULO: ${contract.data.vinculo || '-'}`, 85, dataY + 6);
    doc.text(`PLACA CAVALO: ${contract.data.cavalo || '-'}`, 145, dataY + 6);

    doc.text(`CARRETA I: ${contract.data.carreta || '-'}`, 25, dataY + 12);
    doc.text(`CARRETA II: ${contract.data.carreta2 || '-'}`, 85, dataY + 12);
    doc.text(`ROTA: ${contract.data.rota || contract.data.destino || '-'}`, 145, dataY + 12);

    doc.text(`TECNOLOGIA: ${contract.data.tecnologia || '-'}`, 25, dataY + 18);

    y += 35;

    // Rules Section
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    const rules = [
      "Ao informar início de viagem, deverá aguardar a mensagem \"Ok, Liberado\" que será enviada pela Central de Monitoramento 3corações, autorizando o prosseguimento da viagem;",
      "Informar todas as paradas e reinícios durante a viagem;",
      "Ao chegar no local de descarga, enviar macro \"CHEGADA NO CLIENTE\", e enviando a macro de \"FIM DE VIAGEM\", somente quando a descarga for finalizada;",
      "É proibido parar antes dos 150 km iniciais, exceto paradas obrigatórias ou problema mecânico/elétrico;",
      "É proibido pernoite em residência;",
      "Respeitar o horário de rodagem, no período de 05h00min às 22h00min;",
      "O veículo será desbloqueado após o pernoite, somente mediante confirmação de senha de segurança do motorista, via teclado;",
      "Evitar pernoite sob cobertura, evitando perda de sinal da antena;",
      "Não conceder carona;",
      "Seguir a rota predeterminada;",
      "Respeitar o limite de velocidade da via, não excedendo o limite de 80km/h;",
      "Manter a central informada de todas as anormalidades durante o percurso, mantendo a comunicação, via macro, como também pelos telefones:",
      "Fixo (85) 4006.5522 (escolher a opção desejada); WhatsApp (85) 99198.2886 (apenas mensagem e áudio);",
      "Dirigir preventivamente, evitando acidentes, preservando sua própria vida, a vida de terceiros e também carga do embarcador;",
      "Não oferecer, dar ou aceitar de quem quer que seja, tanto por conta própria ou através de terceiro, qualquer pagamento, doação, compensação,",
      "vantagens ou benefícios de qualquer natureza que constituam prática ilegal ou prática de corrupção sob as leis de qualquer país;",
      "(Proibido passagem por Sergipe);",
      "RJ: Agendar escolta com 2 horas de antecedência do ponto de encontro, no pedágio desativado em Duque de Caxias/RJ, evitar rodar depois das 17 horas",
      "dentro da área urbana da cidade. Caso necessário, o pernoite acontecerá mais cedo na cidade de Três Rios/RJ (Posto Ipirangão);",
      "Pernoite na BR-381 Rod. Fernão Dias, somente autorizado nos postos Rede Graal e Frango Assado;"
    ];

    rules.forEach(rule => {
      doc.text(rule, 20, y);
      y += 3.5;
    });

    y += 4;
    doc.setFont("helvetica", "bold");
    doc.text("Caso tenha dúvidas, contate nossa central de monitoramento pelos telefones acima informados.", 20, y);

    // Footer & Signature
    y += 8;
    doc.setFontSize(6);
    doc.setFont("helvetica", "normal");
    doc.text(`Santa Luzia, ${new Date(contract.signed_at || contract.created_at).toLocaleDateString('pt-BR')}`, 190, y, { align: 'right' });
    
    if (contract.signature) {
      y += 5;
      try {
        doc.addImage(contract.signature, 'PNG', 75, y, 60, 20);
      } catch (e) {
        console.error("Failed to add signature to PDF", e);
      }
      y += 22;
      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(60, y, 150, y);
      doc.setFont("helvetica", "bold");
      doc.text("(Assinatura do Motorista)", 105, y + 4, { align: 'center' });
      doc.setFont("helvetica", "normal");
      doc.text(contract.data.motorista || "", 105, y + 8, { align: 'center' });
    }
    
    return y + 15;
  };

  const downloadPDF = async (contract: Contract) => {
    const doc = new jsPDF();
    
    // Page 1: Check-list Presencial Veicular
    generateChecklistContent(doc, contract, 15);
    
    // Page 2: Termo de Responsabilidade GR
    doc.addPage();
    generateTermContent(doc, contract, 15, "TERMO DE RESPONSABILIDADE GR");

    doc.save(`contrato_completo_${contract.data.motorista || contract.id}.pdf`);
  };

  const stats = [
    { name: 'Assinados', value: contracts.filter(c => c.signature).length, color: '#10b981' },
    { name: 'Pendentes', value: contracts.filter(c => !c.signature).length, color: '#f59e0b' },
  ];

  const filteredContracts = contracts.filter(c => 
    c.data.motorista?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.data.cpf?.includes(searchTerm) ||
    c.data.cavalo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.data.carreta?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.id.includes(searchTerm)
  );

  return (
    <div className="min-h-screen bg-zinc-50 font-sans text-zinc-900 selection:bg-accent-orange selection:text-white">
      {/* Modern Sidebar/Nav Layout */}
      <div className="flex flex-col lg:flex-row min-h-screen">
        {/* Sidebar */}
        <aside className="w-full lg:w-72 bg-coffee-950 text-white p-8 flex flex-col relative overflow-hidden">
          {/* Background Pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none">
            <div className="absolute inset-0 bg-[radial-gradient(#f27d26_1px,transparent_1px)] [background-size:20px_20px]"></div>
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-12">
              <div className="w-12 h-12 bg-accent-orange rounded-2xl flex items-center justify-center shadow-xl shadow-accent-orange/20">
                <ShieldCheck className="text-white w-7 h-7" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tighter">AssinaGR</h1>
                <p className="text-[10px] text-accent-orange font-bold uppercase tracking-widest">Risk Management</p>
              </div>
            </div>

            <nav className="space-y-3">
              <button 
                onClick={() => setActiveTab('generate')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'generate' ? 'bg-white text-coffee-950 shadow-xl shadow-white/5' : 'text-coffee-500 hover:bg-white/5 hover:text-white'}`}
              >
                <LayoutDashboard className="w-5 h-5" />
                Painel de Controle
              </button>
              <button 
                onClick={() => setActiveTab('history')}
                className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-white text-coffee-950 shadow-xl shadow-white/5' : 'text-coffee-500 hover:bg-white/5 hover:text-white'}`}
              >
                <History className="w-5 h-5" />
                Histórico de Termos
              </button>
            </nav>
          </div>

          <div className="mt-auto pt-8 border-t border-white/10 relative z-10">
            <div className="glass-dark rounded-[2rem] p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-8 h-8 bg-accent-orange/20 rounded-xl flex items-center justify-center">
                  <Info className="w-4 h-4 text-accent-orange" />
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Segurança</span>
              </div>
              <AnimatePresence mode="wait">
                <motion.p 
                  key={currentPhraseIndex}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="text-xs text-zinc-300 font-medium leading-relaxed italic"
                >
                  "{SECURITY_PHRASES[currentPhraseIndex]}"
                </motion.p>
              </AnimatePresence>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 lg:p-12 overflow-y-auto custom-scrollbar relative">
          {/* Subtle Background Image */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none">
            <img 
              src="https://picsum.photos/seed/coffee-beans/1920/1080" 
              alt="Background" 
              className="w-full h-full object-cover grayscale"
              referrerPolicy="no-referrer"
            />
          </div>
          
          <div className="relative z-10">
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div className="space-y-2">
              <h2 className="text-4xl font-black tracking-tight text-coffee-950 uppercase">
                {activeTab === 'generate' ? 'Novo Registro' : 'Histórico'}
              </h2>
              <p className="text-zinc-500 font-medium">
                {activeTab === 'generate' ? 'Importe dados para gerar links de assinatura digital.' : 'Gerencie e visualize todos os termos assinados.'}
              </p>
            </div>
            
            <div className="flex items-center gap-4 glass p-3 rounded-2xl">
              <div className="flex -space-x-3">
                {contracts.slice(0, 4).map((c, i) => (
                  <div key={i} className="w-10 h-10 rounded-xl bg-coffee-900 border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-sm">
                    {c.data.motorista?.[0] || 'M'}
                  </div>
                ))}
                {contracts.length > 4 && (
                  <div className="w-10 h-10 rounded-xl bg-accent-orange border-2 border-white flex items-center justify-center text-xs font-black text-white shadow-sm">
                    +{contracts.length - 4}
                  </div>
                )}
              </div>
              <div className="pr-2">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Atividade</p>
                <p className="text-sm font-bold text-coffee-950">{contracts.length} Motoristas</p>
              </div>
            </div>
          </header>

          <AnimatePresence mode="wait">
            {activeTab === 'generate' ? (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-1 xl:grid-cols-3 gap-8"
              >
                {/* Input Section */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200/50 border border-zinc-100 relative overflow-hidden">
                    {/* Decorative Image */}
                    <div className="absolute top-0 right-0 w-64 h-64 opacity-[0.03] -mr-16 -mt-16 rotate-12">
                      <Truck className="w-full h-full" />
                    </div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-3 bg-accent-orange/10 rounded-2xl">
                        <Clipboard className="w-6 h-6 text-accent-orange" />
                      </div>
                      <h3 className="text-xl font-black text-coffee-950 uppercase tracking-tight">Importar Dados</h3>
                    </div>
                    
                    <textarea
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Cole aqui a linha da planilha..."
                      className="w-full h-48 p-6 rounded-3xl border-2 border-zinc-100 bg-zinc-50 font-mono text-sm focus:outline-none focus:border-accent-orange/30 focus:bg-white transition-all resize-none mb-6 custom-scrollbar"
                    />
                    
                    <button
                      onClick={handleProcess}
                      disabled={loading || !inputText.trim()}
                      className="w-full py-5 bg-coffee-950 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] hover:bg-coffee-900 hover:shadow-2xl hover:shadow-coffee-950/20 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                    >
                      {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                        <>
                          <Truck className="w-6 h-6 group-hover:-translate-x-1 transition-transform" />
                          Processar e Gerar Link
                          <ChevronRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>

                  {parsedData && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200/50 border border-zinc-100"
                    >
                      <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                          <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                          </div>
                          <h3 className="text-xl font-black text-coffee-950 uppercase tracking-tight">Dados Extraídos</h3>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[
                          { label: 'Motorista', value: parsedData.motorista, icon: User },
                          { label: 'CPF', value: parsedData.cpf, icon: Fingerprint },
                          { label: 'Placa', value: parsedData.cavalo, icon: Truck },
                          { label: 'Transportadora', value: parsedData.transportador, icon: ShieldCheck },
                          { label: 'Rota', value: parsedData.rota || parsedData.destino, icon: MapPin },
                          { label: 'Tecnologia', value: parsedData.tecnologia, icon: Info },
                        ].map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2 text-zinc-400">
                              <item.icon className="w-3.5 h-3.5" />
                              <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                            </div>
                            <p className="text-sm font-bold text-coffee-950 truncate">{item.value || '-'}</p>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Link Section */}
                <div className="space-y-6">
                  <div className="bg-white rounded-[2.5rem] p-8 shadow-2xl shadow-zinc-200/50 border border-zinc-100 h-full flex flex-col relative overflow-hidden">
                    {/* Decorative Background */}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-50/50 to-transparent pointer-events-none"></div>

                    <div className="flex items-center gap-4 mb-8 relative z-10">
                      <div className="p-3 bg-amber-500/10 rounded-2xl">
                        <LinkIcon className="w-6 h-6 text-amber-600" />
                      </div>
                      <h3 className="text-xl font-black text-coffee-950 uppercase tracking-tight">Link de Assinatura</h3>
                    </div>

                    {generatedLink ? (
                      <div className="flex-1 flex flex-col justify-center space-y-8 relative z-10">
                        <div className="p-8 bg-zinc-50 rounded-[2rem] border-2 border-zinc-100 flex flex-col items-center text-center group transition-all hover:border-accent-orange/20 hover:bg-white">
                          <div className="w-20 h-20 bg-white rounded-3xl shadow-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                            <LinkIcon className="w-10 h-10 text-accent-orange" />
                          </div>
                          <p className="text-sm text-zinc-600 mb-6 font-bold">O link exclusivo está pronto.</p>
                          <div className="w-full p-4 bg-white border-2 border-zinc-100 rounded-2xl flex items-center gap-3 mb-6 shadow-sm">
                            <span className="text-[10px] font-mono text-zinc-400 truncate flex-1 font-bold">{generatedLink}</span>
                            <button
                              onClick={copyToClipboard}
                              className="p-3 hover:bg-zinc-50 rounded-xl transition-all active:scale-95"
                            >
                              {copied ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5 text-zinc-400" />}
                            </button>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-6 bg-coffee-950 rounded-[1.5rem] shadow-xl shadow-coffee-950/10">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <AlertCircle className="w-5 h-5 text-accent-orange shrink-0" />
                          </div>
                          <p className="text-[10px] text-zinc-300 font-medium leading-relaxed">
                            O motorista deve assinar digitalmente para validar o checklist. O processo é otimizado para dispositivos móveis.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center text-center p-12 relative z-10">
                        <div className="w-24 h-24 bg-zinc-50 rounded-full flex items-center justify-center mb-6 animate-pulse">
                          <Clock className="w-12 h-12 text-zinc-200" />
                        </div>
                        <p className="text-zinc-400 text-sm font-bold italic max-w-[200px]">Aguardando dados para gerar o link de acesso.</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="history"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-12"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                  {[
                    { label: 'Total Registros', value: contracts.length, icon: FileText, color: 'coffee' },
                    { label: 'Assinados', value: contracts.filter(c => c.signature).length, icon: CheckCircle2, color: 'emerald' },
                    { label: 'Pendentes', value: contracts.filter(c => !c.signature).length, icon: Clock, color: 'amber' },
                    { label: 'Eficiência', value: `${contracts.length ? Math.round((contracts.filter(c => c.signature).length / contracts.length) * 100) : 0}%`, icon: ShieldCheck, color: 'accent' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white rounded-[2rem] p-8 shadow-2xl shadow-zinc-200/50 border border-zinc-100 flex items-center gap-6 group hover:scale-[1.02] transition-all">
                      <div className={`p-4 rounded-2xl ${
                        stat.color === 'coffee' ? 'bg-coffee-950 text-white' : 
                        stat.color === 'emerald' ? 'bg-emerald-500/10 text-emerald-600' :
                        stat.color === 'amber' ? 'bg-amber-500/10 text-amber-600' :
                        'bg-accent-orange/10 text-accent-orange'
                      }`}>
                        <stat.icon className="w-7 h-7" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">{stat.label}</p>
                        <p className="text-3xl font-black text-coffee-950 tracking-tighter">{stat.value}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Table Section */}
                <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-zinc-200/50 border border-zinc-100 overflow-hidden">
                  <div className="p-8 border-b border-zinc-50 flex flex-col lg:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-zinc-100 rounded-2xl">
                        <Search className="w-6 h-6 text-zinc-500" />
                      </div>
                      <h3 className="text-xl font-black text-coffee-950 uppercase tracking-tight">Filtrar Registros</h3>
                    </div>
                    <div className="relative w-full lg:w-[32rem]">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400" />
                      <input 
                        type="text"
                        placeholder="Buscar por Motorista, Placa ou CPF..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-14 pr-6 py-5 bg-zinc-50 border-2 border-zinc-100 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:border-accent-orange/30 focus:bg-white transition-all"
                      />
                    </div>
                  </div>

                  <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-zinc-50/50 text-[10px] font-black uppercase tracking-widest text-zinc-400 border-b border-zinc-100">
                          <th className="px-8 py-6">Motorista / ID</th>
                          <th className="px-8 py-6">Identificação</th>
                          <th className="px-8 py-6">Data Emissão</th>
                          <th className="px-8 py-6">Status</th>
                          <th className="px-8 py-6 text-right">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-50">
                        {historyLoading ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center">
                              <Loader2 className="w-12 h-12 animate-spin mx-auto text-zinc-200" />
                            </td>
                          </tr>
                        ) : filteredContracts.length === 0 ? (
                          <tr>
                            <td colSpan={5} className="px-8 py-20 text-center text-zinc-400 font-bold italic text-sm">
                              Nenhum registro encontrado.
                            </td>
                          </tr>
                        ) : (
                          filteredContracts.map((contract) => (
                            <tr key={contract.id} className="group hover:bg-zinc-50/50 transition-colors">
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl bg-coffee-950 flex items-center justify-center text-white font-black text-sm shadow-lg shadow-coffee-950/10">
                                    {contract.data.motorista?.[0] || 'M'}
                                  </div>
                                  <div>
                                    <div className="font-black text-coffee-950 uppercase tracking-tight">{contract.data.motorista || 'N/A'}</div>
                                    <div className="text-[10px] text-zinc-400 font-mono font-bold">{contract.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="text-sm font-bold text-zinc-600">{contract.data.cpf || '-'}</div>
                                <div className="text-[10px] text-zinc-400 font-black uppercase tracking-widest flex items-center gap-2 mt-1">
                                  <Truck className="w-3 h-3" />
                                  {contract.data.cavalo || '-'}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                <div className="flex items-center gap-3 text-sm font-bold text-zinc-600">
                                  <Calendar className="w-4 h-4 text-zinc-300" />
                                  {new Date(contract.created_at).toLocaleDateString('pt-BR')}
                                </div>
                              </td>
                              <td className="px-8 py-6">
                                {contract.signature ? (
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                    Assinado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-600 rounded-full text-[10px] font-black uppercase tracking-widest">
                                    <Clock className="w-3.5 h-3.5" />
                                    Pendente
                                  </span>
                                )}
                              </td>
                              <td className="px-8 py-6 text-right">
                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                                  <button 
                                    onClick={() => {
                                      const link = `${window.location.origin}/sign/${contract.id}`;
                                      navigator.clipboard.writeText(link);
                                      alert("Link copiado!");
                                    }}
                                    className="p-3 text-zinc-400 hover:text-accent-orange hover:bg-accent-orange/10 rounded-xl transition-all"
                                    title="Copiar Link"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => downloadPDF(contract)}
                                    className="p-3 text-zinc-400 hover:text-coffee-950 hover:bg-coffee-950/10 rounded-xl transition-all"
                                    title="Baixar PDF"
                                  >
                                    <Download className="w-5 h-5" />
                                  </button>
                                  <button 
                                    onClick={() => handleDelete(contract.id)}
                                    className="p-3 text-zinc-400 hover:text-accent-red hover:bg-accent-red/10 rounded-xl transition-all"
                                    title="Excluir"
                                  >
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};
