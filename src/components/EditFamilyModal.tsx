import React, { useState } from 'react';
import { FamilyNames } from '../types';
import { User, Heart, Baby, Check, RotateCcw, X, Sparkles } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  familyNames: FamilyNames;
  onSaveFamilyNames: (newNames: FamilyNames) => void;
}

export const EditFamilyModal: React.FC<Props> = ({
  isOpen,
  onClose,
  familyNames,
  onSaveFamilyNames
}) => {
  const [husband, setHusband] = useState(familyNames.husband);
  const [wife, setWife] = useState(familyNames.wife);
  const [child, setChild] = useState(familyNames.child);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveFamilyNames({
      husband: husband.trim() || 'Suren',
      wife: wife.trim() || 'Nicole',
      child: child.trim() || 'Gerard (2yo)'
    });
    onClose();
  };

  const handleReset = () => {
    setHusband('Suren');
    setWife('Nicole');
    setChild('Gerard (2yo)');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-gradient-to-tr from-sky-500 to-indigo-500 text-white rounded-xl shadow-md">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-900">Edit Family Member Names</h3>
              <p className="text-xs text-slate-500">Customize labels for roster import & filters</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Husband Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <User className="w-4 h-4 text-red-600" />
              <span>Suren (Hospital Doctor) Name</span>
            </label>
            <input
              type="text"
              value={husband}
              onChange={(e) => setHusband(e.target.value)}
              placeholder="e.g. Suren"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Used for hospital call rosters &amp; duty shifts</p>
          </div>

          {/* Wife Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Heart className="w-4 h-4 text-blue-600" />
              <span>Nicole Name</span>
            </label>
            <input
              type="text"
              value={wife}
              onChange={(e) => setWife(e.target.value)}
              placeholder="e.g. Nicole"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Used for court hearings &amp; late night calls</p>
          </div>

          {/* Child Name */}
          <div>
            <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
              <Baby className="w-4 h-4 text-cyan-600" />
              <span>Child / Toddler Name</span>
            </label>
            <input
              type="text"
              value={child}
              onChange={(e) => setChild(e.target.value)}
              placeholder="e.g. Gerard (2yo)"
              required
              className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500 bg-slate-50/50"
            />
            <p className="text-[11px] text-slate-400 mt-0.5">Used for nursery, pediatrician & playgroups</p>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-2 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 text-xs font-bold text-white bg-sky-600 hover:bg-sky-700 rounded-xl shadow-md transition-colors flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Save Names</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
