"use client";

import React, { useState } from 'react';
import { Sprout, Plus } from 'lucide-react';

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl max-w-lg w-full p-6 space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--color-border)] pb-3">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-lg bg-[var(--color-canal)]/10 text-[var(--color-canal)] border border-[var(--color-canal)]/20">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[var(--color-text-primary)]">Register New Farm</h3>
              <p className="text-xs text-[var(--color-text-secondary)]">Farmer Onboarding Wizard</p>
            </div>
          </div>
          <button onClick={onClose} className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-bold text-sm">
            ✕
          </button>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          
          <div>
            <label className="text-[var(--color-text-secondary)] font-bold block mb-1">Farmer Name:</label>
            <input
              type="text"
              required
              placeholder="e.g. Dnyaneshwar Patil"
              value={formData.farmer_name}
              onChange={(e) => setFormData({ ...formData, farmer_name: e.target.value })}
              className="w-full bg-white border border-[var(--color-border)] rounded-lg p-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-canal)]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-text-secondary)] font-bold block mb-1">Crop Type:</label>
              <select
                value={formData.crop_name}
                onChange={(e) => setFormData({ ...formData, crop_name: e.target.value })}
                className="w-full bg-white border border-[var(--color-border)] rounded-lg p-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-canal)]"
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
              <label className="text-[var(--color-text-secondary)] font-bold block mb-1">Farm Area (Acres):</label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                max="50"
                value={formData.area_acres}
                onChange={(e) => setFormData({ ...formData, area_acres: parseFloat(e.target.value) || 1.0 })}
                className="w-full bg-white border border-[var(--color-border)] rounded-lg p-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-canal)]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[var(--color-text-secondary)] font-bold block mb-1">Growth Stage:</label>
              <select
                value={formData.growth_stage}
                onChange={(e) => setFormData({ ...formData, growth_stage: e.target.value })}
                className="w-full bg-white border border-[var(--color-border)] rounded-lg p-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-canal)]"
              >
                <option value="Flowering">Flowering</option>
                <option value="Fruit Development">Fruit Development</option>
                <option value="Bulb Development">Bulb Development</option>
                <option value="Vegetative">Vegetative</option>
                <option value="Initial / Germination">Initial / Germination</option>
              </select>
            </div>

            <div>
              <label className="text-[var(--color-text-secondary)] font-bold block mb-1">Soil Type:</label>
              <select
                value={formData.soil_type}
                onChange={(e) => setFormData({ ...formData, soil_type: e.target.value })}
                className="w-full bg-white border border-[var(--color-border)] rounded-lg p-2.5 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-canal)]"
              >
                <option value="Clay">Clay</option>
                <option value="Loam">Loam</option>
                <option value="Black">Black (Regur)</option>
                <option value="Sandy">Sandy</option>
              </select>
            </div>
          </div>

          <div className="pt-3 border-t border-[var(--color-border)] flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[var(--color-surface-subtle)] hover:bg-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold transition border border-[var(--color-border)]"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 rounded-lg bg-[var(--color-canal)] hover:bg-[var(--color-canal-hover)] text-white font-bold transition flex items-center space-x-1.5 disabled:opacity-50"
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
