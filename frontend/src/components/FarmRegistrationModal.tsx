"use client";

import React, { useState } from 'react';
import { Sprout, Plus, CheckCircle } from 'lucide-react';

interface FarmRegistrationModalProps {
  onClose: () => void;
  onAddFarm: (farmData: any) => Promise<void>;
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.farmer_name.trim()) return;
    setIsSubmitting(true);
    try {
      await onAddFarm(formData);
      onClose();
    } catch (err) {
      console.error(err);
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
              <Sprout className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Register New Farm</h3>
              <p className="text-xs text-emerald-700 font-medium">Farmer Onboarding Wizard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-slate-700 font-bold block mb-1">Farmer Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Dnyaneshwar Patil"
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
              <Plus className="h-4 w-4" />
              <span>{isSubmitting ? "Saving..." : "Add Farm & Calculate Need"}</span>
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
