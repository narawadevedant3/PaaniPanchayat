import React, { useState } from 'react';
import { Droplets, Plus, ShieldAlert, Clock, Sprout } from 'lucide-react';
import { FarmFormData } from '../types';

interface FarmRegistrationModalProps {
  onClose: () => void;
  onAddFarm: (farmData: FarmFormData) => Promise<void>;
}

export const FarmRegistrationModal: React.FC<FarmRegistrationModalProps> = ({ onClose, onAddFarm }) => {
  const [formData, setFormData] = useState({
    farmer_name: '',
    crop_name: 'Wheat',
    area_acres: 2.0,
    growth_stage: 'Flowering',
    soil_type: 'Clay',
    irrigation_efficiency: 0.75,
    previous_irrigation_liters: 5000.0,
    is_critical_stage: false
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmer_name.trim()) return;
    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await onAddFarm(formData);
      onClose();
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err?.message || "Failed to submit water request. 1 request allowed per farmer every 3 days.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-emerald-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 text-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-emerald-100 pb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700">
              <Droplets className="h-6 w-6 text-emerald-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Create Water Request</h3>
              <p className="text-xs text-emerald-700 font-medium">Submit Crop & Land Details for Allocation</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Panchayat Policy Warning Banner */}
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center space-x-2">
          <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
          <span><strong>Panchayat Rule:</strong> 1 Water Request allowed per farmer every 3 days.</span>
        </div>

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start space-x-2">
            <ShieldAlert className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-slate-700 font-bold block mb-1">Farm Name / Plot Title:</label>
            <input
              type="text"
              required
              placeholder="e.g. North Canal Plot 1"
              value={formData.farmer_name}
              onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Crop Type:</label>
              <select
                value={formData.crop_name}
                onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Wheat">Wheat</option>
                <option value="Tomato">Tomato</option>
                <option value="Sugarcane">Sugarcane</option>
                <option value="Onion">Onion</option>
                <option value="Cotton">Cotton</option>
                <option value="Rice">Rice</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Farm Area (Acres):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={formData.area_acres}
                onChange={(e) => setFormData({ ...formData, area_acres: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-slate-700 font-bold block mb-1">Growth Stage:</label>
              <select
                value={formData.growth_stage}
                onChange={(e) => setFormData({ ...formData, growth_stage: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Flowering">Flowering</option>
                <option value="Fruit Development">Fruit Development</option>
                <option value="Bulb Development">Bulb Development</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Initial / Germination">Initial / Germination</option>
              </select>
            </div>

            <div>
              <label className="text-slate-700 font-bold block mb-1">Soil Type:</label>
              <select
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-900 focus:outline-none focus:border-emerald-500"
              >
                <option value="Clay">Clay</option>
                <option value="Loam">Loam</option>
                <option value="Black">Black (Regur)</option>
                <option value="Sandy">Sandy</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold transition shadow-sm flex items-center space-x-1.5"
            >
              <Droplets className="h-4 w-4" />
              <span>{isSubmitting ? "Submitting..." : "Submit Water Request"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
