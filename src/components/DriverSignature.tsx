import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, 
  CheckCircle, 
  Loader2, 
  AlertCircle, 
  ChevronRight, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  User, 
  ClipboardCheck,
  Info,
  Lock,
  ArrowRight,
  MapPin,
  Calendar,
  Fingerprint,
  Check
} from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { Contract } from '../types';
import { CHECKLIST_ITEMS } from '../constants';
import { supabase } from '../lib/supabase';

const SECURITY_TIPS = [
  "Sua segurança é nossa prioridade. Respeite os limites de velocidade.",
  "Mantenha a Central de Monitoramento informada sobre qualquer parada.",
  "Atenção redobrada em áreas de risco. Siga a rota predeterminada.",
  "O uso do cinto de segurança é obrigatório em todo o percurso.",
  "Não dê carona a estranhos. Sua vida vale mais que qualquer carga."
];

export const DriverSignature: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);
  const [step, setStep] = useState(0); // 0: Landing, 1: Checklist, 2: Termo, 3: Assinatura
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  useEffect(() => {
    const fetchContract = async () => {
      try {
        const { data, error } = await supabase
          .from('contracts')
          .select('*')
          .eq('id', id)
          .single();
          
        if (error || !data) throw new Error('Contrato não encontrado');
        setContract(data);
        if (data.signature) setSigned(true);
      } catch (err) {
        setError('Link inválido ou expirado.');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [id]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % SECURITY_TIPS.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleSign = async (signature: string) => {
    try {
      const { error } = await supabase
        .from('contracts')
        .update({ 
          signature, 
          signed_at: new Date().toISOString() 
        })
        .eq('id', id);

      if (!error) {
        setSigned(true);
      } else {
        throw error;
      }
    } catch (err) {
      alert('Erro ao salvar assinatura.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-coffee-950 flex flex-col items-center justify-center gap-6">
        <div className="relative">
          <Loader2 className="w-16 h-16 animate-spin text-accent-orange" />
          <div className="absolute inset-0 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
        </div>
        <div className="text-center space-y-2">
          <p className="text-white font-bold text-lg tracking-tight">AssinaGR</p>
          <p className="text-coffee-500 text-xs font-bold uppercase tracking-[0.3em] animate-pulse">Autenticando Acesso</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-coffee-950 flex flex-col items-center justify-center p-8 text-center space-y-8">
        <div className="w-24 h-24 bg-accent-red/10 rounded-full flex items-center justify-center border border-accent-red/20">
          <AlertCircle className="w-12 h-12 text-accent-red" />
        </div>
        <div className="space-y-3">
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Acesso Negado</h1>
          <p className="text-coffee-500 max-w-xs mx-auto text-sm leading-relaxed">{error || "Este link de assinatura não é mais válido ou o contrato foi removido."}</p>
        </div>
        <button 
          onClick={() => window.location.reload()}
          className="w-full max-w-xs py-4 bg-white text-coffee-950 rounded-2xl font-bold text-sm uppercase tracking-widest shadow-xl shadow-white/5 active:scale-95 transition-transform"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  if (signed) {
    return (
      <div className="min-h-screen bg-coffee-950 flex flex-col items-center justify-center p-6">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="glass-dark p-10 rounded-[2.5rem] max-w-md w-full text-center space-y-8"
        >
          <div className="w-24 h-24 bg-emerald-500/20 rounded-3xl flex items-center justify-center mx-auto border border-emerald-500/30">
            <CheckCircle className="w-12 h-12 text-emerald-400" />
          </div>
          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Tudo Pronto!</h1>
            <p className="text-coffee-500 text-sm leading-relaxed">
              Obrigado, <span className="text-white font-bold">{contract.data.motorista}</span>. Seu registro de segurança foi concluído e enviado para a central.
            </p>
          </div>
          
          <div className="p-5 bg-white/5 rounded-2xl border border-white/10 flex items-center gap-4 text-left">
            <div className="w-10 h-10 bg-accent-orange/20 rounded-xl flex items-center justify-center shrink-0">
              <ShieldCheck className="w-6 h-6 text-accent-orange" />
            </div>
            <div>
              <p className="text-[10px] text-white font-bold uppercase tracking-wider">Documento Seguro</p>
              <p className="text-[9px] text-coffee-500 leading-tight">Assinatura digital vinculada ao seu CPF e geolocalização.</p>
            </div>
          </div>

          <div className="pt-6">
            <p className="text-[10px] text-coffee-700 font-mono uppercase tracking-[0.4em]">ASSINAGR • {new Date().getFullYear()}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-coffee-950 text-white font-sans selection:bg-accent-orange selection:text-white overflow-x-hidden">
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div 
            key="landing"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative min-h-screen flex flex-col"
          >
            {/* Background Image with Overlay */}
            <div className="absolute inset-0 z-0">
              <img 
                src="https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=2070&auto=format&fit=crop" 
                alt="Coffee Production" 
                className="w-full h-full object-cover opacity-40 grayscale-[0.5]"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-coffee-950/80 via-coffee-950/60 to-coffee-950"></div>
            </div>

            <div className="relative z-10 flex-1 flex flex-col p-8 md:p-12">
              <header className="flex items-center gap-3 mb-auto">
                <div className="w-12 h-12 bg-accent-orange rounded-2xl flex items-center justify-center shadow-lg shadow-accent-orange/20">
                  <ShieldCheck className="text-white w-7 h-7" />
                </div>
                <div>
                  <h1 className="text-2xl font-black tracking-tighter">AssinaGR</h1>
                  <p className="text-[10px] text-accent-orange font-bold uppercase tracking-widest">3 Corações • Segurança</p>
                </div>
              </header>

              <main className="space-y-10 mb-12">
                <div className="space-y-4">
                  <motion.h2 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="text-5xl md:text-7xl font-black leading-[0.9] tracking-tighter"
                  >
                    BEM-VINDO,<br/>
                    <span className="text-accent-orange uppercase">{contract.data.motorista?.split(' ')[0]}</span>
                  </motion.h2>
                  <motion.p 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-coffee-500 text-lg max-w-md leading-relaxed"
                  >
                    Inicie o processo de carregamento assinando os termos de responsabilidade e segurança.
                  </motion.p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="glass-dark p-6 rounded-3xl space-y-3">
                    <Truck className="w-8 h-8 text-accent-orange" />
                    <div>
                      <p className="text-[10px] text-coffee-500 font-bold uppercase tracking-wider">Veículo</p>
                      <p className="text-xl font-bold">{contract.data.cavalo}</p>
                    </div>
                  </div>
                  <div className="glass-dark p-6 rounded-3xl space-y-3">
                    <MapPin className="w-8 h-8 text-accent-orange" />
                    <div>
                      <p className="text-[10px] text-coffee-500 font-bold uppercase tracking-wider">Destino</p>
                      <p className="text-xl font-bold truncate">{contract.data.destino || "A definir"}</p>
                    </div>
                  </div>
                </div>
              </main>

              <footer className="space-y-6">
                <button 
                  onClick={() => setStep(1)}
                  className="w-full py-6 bg-white text-coffee-950 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 shadow-2xl shadow-white/10 active:scale-95 transition-all group"
                >
                  INICIAR REGISTRO
                  <ArrowRight className="w-6 h-6 group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="flex items-center justify-center gap-2 text-coffee-700">
                  <Lock className="w-4 h-4" />
                  <span className="text-[10px] font-bold uppercase tracking-widest">Ambiente 100% Seguro</span>
                </div>
              </footer>
            </div>
          </motion.div>
        )}

        {step > 0 && (
          <motion.div 
            key="steps"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-screen flex flex-col bg-coffee-950"
          >
            {/* Sticky Header */}
            <header className="sticky top-0 z-50 glass-dark px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setStep(prev => prev - 1)}
                  className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
                <div>
                  <h3 className="text-sm font-bold tracking-tight">
                    {step === 1 ? 'Checklist Veicular' : step === 2 ? 'Termo de Responsabilidade' : 'Assinatura Digital'}
                  </h3>
                  <div className="flex gap-1 mt-1">
                    {[1, 2, 3].map(s => (
                      <div key={s} className={`h-1 rounded-full transition-all ${step === s ? 'w-6 bg-accent-orange' : step > s ? 'w-3 bg-emerald-500' : 'w-3 bg-white/10'}`}></div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-accent-orange/10 rounded-xl flex items-center justify-center">
                <ShieldCheck className="w-6 h-6 text-accent-orange" />
              </div>
            </header>

            <main className="flex-1 p-6 overflow-y-auto custom-scrollbar">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div 
                    key="step1"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-6"
                  >
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black tracking-tight">VISTORIA TÉCNICA</h4>
                      <p className="text-coffee-500 text-sm">Confirme as condições do veículo para prosseguir.</p>
                    </div>

                    <div className="space-y-3">
                      {CHECKLIST_ITEMS.map((item, idx) => (
                        <div 
                          key={idx}
                          className="glass-dark p-5 rounded-3xl flex items-start gap-4 border-l-4 border-l-accent-orange"
                        >
                          <div className="w-8 h-8 rounded-full bg-accent-orange/20 flex items-center justify-center shrink-0 text-accent-orange font-black text-xs">
                            {idx + 1}
                          </div>
                          <div className="flex-1 space-y-1">
                            <p className="text-sm font-medium leading-snug text-zinc-100">{item}</p>
                            <div className="flex items-center gap-2 text-emerald-400">
                              <CheckCircle className="w-4 h-4" />
                              <span className="text-[10px] font-bold uppercase tracking-wider">Conforme</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-6">
                      <button 
                        onClick={() => setStep(2)}
                        className="w-full py-5 bg-accent-orange text-white rounded-2xl font-black text-lg shadow-xl shadow-accent-orange/20 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        CONFIRMAR TUDO <ChevronRight className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div 
                    key="step2"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="space-y-2">
                      <h4 className="text-2xl font-black tracking-tight uppercase">Termo de Segurança</h4>
                      <p className="text-coffee-500 text-sm">Leia atentamente as regras de monitoramento.</p>
                    </div>

                    <div className="glass-dark p-8 rounded-[2.5rem] space-y-6 text-sm leading-relaxed text-zinc-300">
                      <div className="space-y-4">
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <Lock className="w-5 h-5 text-accent-orange" />
                          </div>
                          <p>Estou ciente que o descumprimento das normas pode resultar em bloqueio para novos carregamentos.</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <Calendar className="w-5 h-5 text-accent-orange" />
                          </div>
                          <p>Respeitarei o horário de rodagem das <span className="text-white font-bold">05:00 às 22:00</span>.</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center shrink-0">
                            <Truck className="w-5 h-5 text-accent-orange" />
                          </div>
                          <p>Não concederei carona e seguirei estritamente a rota predeterminada.</p>
                        </div>
                      </div>

                      <div className="h-px bg-white/10 w-full"></div>

                      <div className="space-y-4">
                        <p>Declaro que fui contratado pela transportadora <span className="text-white font-bold">{contract.data.transportador}</span> para o transporte de carga do embarcador <span className="text-accent-orange font-bold">3 CORAÇÕES</span>.</p>
                        <p>Comprometo-me a entregar a carga ao destinatário em perfeitas condições e manter a central informada de todas as paradas.</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={() => setStep(3)}
                        className="w-full py-5 bg-white text-coffee-950 rounded-2xl font-black text-lg shadow-xl shadow-white/5 active:scale-95 transition-all flex items-center justify-center gap-3"
                      >
                        LI E CONCORDO <Fingerprint className="w-6 h-6" />
                      </button>
                    </div>
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div 
                    key="step3"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="space-y-8"
                  >
                    <div className="text-center space-y-3">
                      <div className="w-20 h-20 bg-accent-orange/10 rounded-3xl flex items-center justify-center mx-auto border border-accent-orange/20">
                        <Fingerprint className="w-10 h-10 text-accent-orange" />
                      </div>
                      <h4 className="text-3xl font-black tracking-tight">ASSINATURA</h4>
                      <p className="text-coffee-500 text-sm">Use o dedo para assinar no campo abaixo.</p>
                    </div>

                    <div className="glass-dark p-4 rounded-[2rem] overflow-hidden">
                      <SignaturePad onSave={handleSign} />
                    </div>

                    <div className="p-6 bg-white/5 rounded-3xl border border-white/10 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-coffee-500 uppercase tracking-widest">Motorista</span>
                        <span className="text-sm font-bold">{contract.data.motorista}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-coffee-500 uppercase tracking-widest">CPF</span>
                        <span className="text-sm font-bold">{contract.data.cpf}</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </main>

            {/* Security Tip Footer */}
            <footer className="p-6 glass-dark">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-accent-orange/20 rounded-xl flex items-center justify-center shrink-0">
                  <Info className="w-6 h-6 text-accent-orange" />
                </div>
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={currentTipIndex}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="text-[11px] font-medium leading-tight text-coffee-500"
                  >
                    {SECURITY_TIPS[currentTipIndex]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </footer>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
