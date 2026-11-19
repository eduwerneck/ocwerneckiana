"use client";

import { Printer } from "lucide-react";

interface Props {
  paperId?: number;
  title?: string;
  fileName?: string;
}

export default function DownloadButton(_props: Props) {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="bg-purple-700 hover:bg-purple-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs flex items-center justify-center space-x-2 transition shadow-xs cursor-pointer"
    >
      <Printer className="w-4 h-4" />
      <span>Imprimir / Salvar em PDF</span>
    </button>
  );
}
