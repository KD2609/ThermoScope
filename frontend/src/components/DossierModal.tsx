import React from 'react';
import { X, Printer } from 'lucide-react';
import { api } from '../services/api';

interface DossierModalProps {
  anomalyId: number | null;
  onClose: () => void;
}

export const DossierModal: React.FC<DossierModalProps> = ({ anomalyId, onClose }) => {
  if (!anomalyId) return null;

  const reportUrl = api.getReportUrl(anomalyId);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#0f172a] border border-slate-700 w-full max-w-5xl h-[90vh] rounded-xl flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-[#131e36] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-sm text-white">Incident Intelligence Dossier &bull; Print Preview</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const iframe = document.getElementById('dossier-iframe') as HTMLIFrameElement;
                if (iframe && iframe.contentWindow) {
                  iframe.contentWindow.print();
                }
              }}
              className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print / Save as PDF
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Iframe View */}
        <div className="flex-1 bg-white">
          <iframe
            id="dossier-iframe"
            src={reportUrl}
            title="Incident Report"
            className="w-full h-full border-none"
          />
        </div>
      </div>
    </div>
  );
};
