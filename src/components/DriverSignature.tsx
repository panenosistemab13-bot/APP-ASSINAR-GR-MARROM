import React, { useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas'; // Instale: npm install react-signature-canvas
import jsPDF from 'jspdf';
import { supabase } from '../lib/supabase';

export const DriverSignature: React.FC = () => {
  const sigRef = useRef<any>(null);

  const handleSave = async () => {
    // 1. Gera o PDF
    const doc = new jsPDF();
    doc.text("TERMO DE COMPROMISSO", 20, 20);
    doc.text("Termo 1: [Seu texto fixo aqui]", 20, 40);
    doc.text("Termo 2: [Seu texto fixo aqui]", 20, 60);
    
    // Adiciona a imagem da assinatura
    const signatureData = sigRef.current.toDataURL();
    doc.addImage(signatureData, 'PNG', 20, 100, 50, 20);
    
    // 2. Converte PDF para Blob e faz o upload
    const pdfBlob = doc.output('blob');
    
    // 3. Salva no Supabase Storage
    const { error } = await supabase.storage
      .from('assinaturas')
      .upload(`termo_${Date.now()}.pdf`, pdfBlob);
      
    if (!error) alert("Assinado com sucesso!");
  };

  return (
    <div className="p-10">
      <h2 className="text-2xl font-bold">Assinatura do Motorista</h2>
      <div className="border-2 border-black mt-5">
        <SignatureCanvas ref={sigRef} penColor='black' canvasProps={{width: 500, height: 200}} />
      </div>
      <button onClick={handleSave} className="mt-5 bg-green-600 text-white p-3">
        Finalizar e Salvar
      </button>
    </div>
  );
};