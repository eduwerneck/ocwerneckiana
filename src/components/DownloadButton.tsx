"use client";

import { Download } from "lucide-react";

interface Props {
  paperId: number;
  title: string;
  fileName?: string;
}

export default function DownloadButton({ paperId, title, fileName }: Props) {
  const handleDownload = () => {
    alert(`Iniciando download do artigo #${paperId} - "${title}"\nArquivo: ${fileName || "manuscrito.pdf"} (Formato PDF acadêmico OCS com carimbo Dublin Core)`);
  };

  return (
    <button
      onClick={handleDownload}
      className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 transition shadow-xs"
    >
      <Download className="w-4 h-4" />
      <span>Baixar Artigo Completo (PDF)</span>
    </button>
  );
}
