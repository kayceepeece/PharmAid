'use client';

import { useState } from 'react';
import { analyzeInteractions, InteractionAnalysisResults } from '@/services/geminiService';
import { AlertCircle, FileSearch, ShieldAlert } from 'lucide-react';
import { ErrorMessage, LoadingSpinner } from './common/Common';

export function ClinicalPage() {
  const [drugsInput, setDrugsInput] = useState('');
  const [results, setResults] = useState<InteractionAnalysisResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    const drugs = drugsInput.split(',').map(d => d.trim()).filter(d => d.length > 0);
    if (drugs.length < 2) {
      setError('Please enter at least two drugs (comma-separated) to analyze interactions.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const data = await analyzeInteractions(drugs);
      setResults(data);
    } catch (err: any) {
      setError(err.message || "An error occurred during analysis.");
    }
    setLoading(false);
  };

  const getRiskBadgeColor = (risk: string) => {
    switch(risk) {
      case 'Low': return 'bg-green-600 text-white';
      case 'Moderate': return 'bg-yellow-500 text-white';
      case 'High': return 'bg-orange-500 text-white';
      case 'Very High': return 'bg-red-600 text-white';
      case 'Critical': return 'bg-red-600 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getInteractionColor = (severity: string) => {
    switch (severity) {
      case 'Low':
      case 'Minor': return 'bg-green-50 border-green-100 text-green-900';
      case 'Moderate': return 'bg-yellow-50 border-yellow-100 text-yellow-900';
      case 'Major':
      case 'High': return 'bg-orange-50 border-orange-100 text-orange-900';
      case 'Very High':
      case 'Critical': return 'bg-red-50 border-red-100 text-red-900';
      default: return 'bg-gray-50 border-gray-200 text-gray-900';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-8rem)] min-h-[600px]">
      {/* Input Section */}
      <div className="col-span-1 lg:col-span-4 space-y-6">
        <div className="bg-white rounded-xl border border-[#DEE2E6] shadow-sm p-6 h-full flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-blue-600" /> Interaction Check
            </h2>
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Clinical</span>
          </div>

          <div className="flex-1 space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-900">
                Medications
              </label>
              <p className="text-xs text-gray-500 mb-2">Comma-separated list (e.g. Lisinopril, Ibuprofen, Lithium)</p>
              <textarea
                value={drugsInput}
                onChange={(e) => setDrugsInput(e.target.value)}
                rows={6}
                className="w-full p-3 bg-gray-50 border border-[#DEE2E6] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 focus:bg-white transition-colors"
                placeholder="e.g. Lisinopril, Ibuprofen, Lithium"
              />
            </div>
            <ErrorMessage message={error} />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !drugsInput}
            className="w-full mt-auto py-2.5 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'ANALYZING...' : 'ANALYZE INTERACTIONS'}
          </button>
        </div>
      </div>

      {/* Results Section */}
      <div className="col-span-1 lg:col-span-8">
        <div className="bg-white rounded-xl border border-[#DEE2E6] shadow-sm p-6 flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#DEE2E6]">
            <h2 className="text-lg font-bold">Analysis Results</h2>
            {results && (
              <span className={`px-3 py-1 text-xs font-black rounded uppercase ${getRiskBadgeColor(results.overallRiskLevel)}`}>
                Risk: {results.overallRiskLevel}
              </span>
            )}
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <LoadingSpinner />
                <p className="mt-4 font-medium">Analyzing clinical database...</p>
              </div>
            ) : results ? (
              <div className="space-y-6">
                <p className="text-gray-700 leading-relaxed bg-gray-50 p-4 rounded-lg border border-gray-100">{results.summary}</p>
                
                {results.interactions && results.interactions.length > 0 ? (
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-900 border-b pb-2 mb-3">Identified Interactions</h4>
                    {results.interactions.map((interaction, idx) => (
                      <div key={idx} className={`p-4 border rounded-lg flex items-center justify-between ${getInteractionColor(interaction.severity)}`}>
                        <div className="flex items-start gap-4">
                          <div>
                            <p className="font-bold mb-1">{interaction.drugs.join(' + ')}</p>
                            <p className="text-sm opacity-90">{interaction.description}</p>
                          </div>
                        </div>
                        <span className={`px-3 py-1 text-xs font-black rounded uppercase shrink-0 ml-4 ${getRiskBadgeColor(interaction.severity)}`}>
                          {interaction.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-100 text-green-800 font-medium flex items-center">
                    <FileSearch className="w-5 h-5 mr-3 shrink-0" />
                    No significant drug interactions identified among the provided medications. However, always use clinical judgment.
                  </div>
                )}

                {results.managementRecommendations && results.managementRecommendations.length > 0 && (
                  <div className="mt-6">
                    <h4 className="font-bold text-gray-900 border-b pb-2 mb-3">Management Recommendations</h4>
                    <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                      {results.managementRecommendations.map((rec, idx) => (
                        <li key={idx} className="pl-1">{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 text-center">
                <div className="w-16 h-16 bg-gray-50 border-2 border-dashed border-gray-200 rounded-full flex items-center justify-center mb-4">
                  <ShieldAlert className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-500">Awaiting input...</p>
                <p className="text-sm mt-1">Enter a list of medications and click Analyze.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
