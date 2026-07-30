import React, { useState } from 'react';
import { AIAnalysisResult } from '../types';
import { Sparkles, AlertTriangle, Lightbulb, RefreshCw } from 'lucide-react';

interface Props {
  analysis: AIAnalysisResult | null;
  isLoading: boolean;
  onRefreshAnalysis: () => void;
}

export const AiAdvisorCard: React.FC<Props> = ({
  analysis,
  isLoading,
  onRefreshAnalysis
}) => {
  return (
    <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-indigo-900/50 relative overflow-hidden">
      {/* Background Decorative Glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-indigo-800/60 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-tr from-sky-500 to-indigo-500 rounded-xl shadow-lg">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              Gemini AI Work-Life & Fatigue Advisor
              <span className="text-[10px] font-semibold px-2 py-0.5 bg-sky-500/20 text-sky-300 border border-sky-400/30 rounded-full">
                Live Doctor & Lawyer Coach
              </span>
            </h3>
            <p className="text-xs text-indigo-200">
              Smart balance analysis for 24h hospital on-calls, late night court calls & 2yo toddler care
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshAnalysis}
          disabled={isLoading}
          className="flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Analyzing Roster...' : 'Re-Analyze with Gemini AI'}</span>
        </button>
      </div>

      {/* Body Content */}
      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-5 relative z-10">
        {/* Coverage Gaps Column */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-amber-300 mb-3">
            <AlertTriangle className="w-4 h-4" />
            <span>Childcare & Shift Overlaps</span>
          </div>

          {analysis?.childcareGaps && analysis.childcareGaps.length > 0 ? (
            <div className="space-y-2.5">
              {analysis.childcareGaps.slice(0, 2).map((gap, idx) => (
                <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs">
                  <div className="font-semibold text-amber-200">
                    {gap.date} ({gap.startTime} - {gap.endTime})
                  </div>
                  <p className="text-indigo-100 text-[11px] mt-1">{gap.conflictReason}</p>
                  <p className="text-amber-300 font-medium text-[11px] mt-1">💡 {gap.recommendedSolution}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-2.5 text-xs text-indigo-100">
              <div className="font-semibold text-amber-200">Aug 3 (21:30 - 23:30)</div>
              <p className="text-[11px] mt-1">
                Doctor on 24h Trauma Duty + Lawyer Wife on US merger call.
              </p>
              <p className="text-amber-300 font-medium text-[11px] mt-1">
                💡 Nanny Maya on standby for 2yo Gerard.
              </p>
            </div>
          )}
        </div>

        {/* Free Slot Spotter Column */}
        <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-xs font-semibold text-sky-300 mb-3">
            <Lightbulb className="w-4 h-4" />
            <span>Golden Free Timing Match</span>
          </div>

          {analysis?.freeSlots && analysis.freeSlots.length > 0 ? (
            <div className="bg-sky-500/10 border border-sky-400/30 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between font-bold text-sky-200">
                <span>{analysis.freeSlots[0].title}</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
                  Score {analysis.freeSlots[0].score}/10
                </span>
              </div>
              <p className="text-indigo-100 text-[11px] mt-1">
                {analysis.freeSlots[0].date} ({analysis.freeSlots[0].startTime} - {analysis.freeSlots[0].endTime})
              </p>
              <p className="text-sky-300 text-[11px] mt-1">
                {analysis.freeSlots[0].reason}
              </p>
            </div>
          ) : (
            <div className="bg-sky-500/10 border border-sky-400/30 rounded-lg p-3 text-xs">
              <div className="flex items-center justify-between font-bold text-sky-200">
                <span>Saturday Family Outing Window</span>
                <span className="px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded text-[10px]">
                  Score 9.8/10
                </span>
              </div>
              <p className="text-indigo-100 text-[11px] mt-1">
                Aug 8 (14:00 - 18:30)
              </p>
              <p className="text-sky-300 text-[11px] mt-1">
                Doctor off-duty, Lawyer off-duty, Gerard awake & nursery free!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
