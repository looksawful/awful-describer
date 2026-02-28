import { useState } from 'react';
import { useStore } from '../stores/appStore';
import { presetCategories } from '../utils/presets';
import type { Preset } from '../types';

export default function PresetsPanel() {
  const { 
    presets, 
    selectedPreset, 
    setSelectedPreset, 
    addPreset,
    removePreset,
    currentPrompt,
    currentOptions,
    selectedModel,
  } = useStore();

  const [activeCategory, setActiveCategory] = useState<string>('upscaler');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newPresetName, setNewPresetName] = useState('');

  const filteredPresets = presets.filter(p => p.category === activeCategory);

  const handleCreatePreset = () => {
    if (!newPresetName.trim()) return;

    const preset: Preset = {
      id: `custom-${Date.now()}`,
      name: newPresetName,
      category: 'custom',
      prompt: currentPrompt,
      model: selectedModel,
      options: currentOptions,
    };

    addPreset(preset);
    setShowCreateModal(false);
    setNewPresetName('');
    setActiveCategory('custom');
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden border-t border-border-default">
      <div className="panel-header">
        <span className="text-sm font-medium">Presets</span>
        <button
          onClick={() => setShowCreateModal(true)}
          className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
          title="Save current as preset"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </button>
      </div>

      {/* Category tabs */}
      <div className="flex border-b border-border-default">
        {presetCategories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 py-2 text-xs transition-colors ${
              activeCategory === cat.id
                ? 'text-accent-primary border-b-2 border-accent-primary bg-accent-primary/5'
                : 'text-text-muted hover:text-text-secondary hover:bg-bg-tertiary/50'
            }`}
          >
            <span className="mr-1">{cat.icon}</span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Presets list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {filteredPresets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-text-muted">
            <p className="text-sm">No presets in this category</p>
            {activeCategory === 'custom' && (
              <p className="text-xs mt-1">Save your current settings as a preset</p>
            )}
          </div>
        ) : (
          filteredPresets.map((preset) => (
            <div
              key={preset.id}
              onClick={() => setSelectedPreset(preset.id)}
              className={`p-2 rounded cursor-pointer transition-colors group ${
                selectedPreset === preset.id
                  ? 'bg-accent-primary/20 border border-accent-primary/30'
                  : 'hover:bg-bg-tertiary'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">{preset.name}</span>
                {preset.category === 'custom' && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removePreset(preset.id);
                    }}
                    className="p-1 opacity-0 group-hover:opacity-100 hover:bg-status-error/20 rounded"
                  >
                    <svg className="w-3 h-3 text-text-muted hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              {preset.description && (
                <p className="text-xs text-text-muted mt-0.5 line-clamp-1">{preset.description}</p>
              )}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs px-1.5 py-0.5 bg-bg-tertiary rounded text-text-muted">
                  {preset.model.split(':')[0]}
                </span>
                <span className="text-xs text-text-muted">
                  T:{preset.options.temperature}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Clear selection button */}
      {selectedPreset && (
        <div className="p-2 border-t border-border-default">
          <button
            onClick={() => setSelectedPreset(null)}
            className="w-full text-xs py-1.5 bg-bg-tertiary hover:bg-bg-elevated rounded text-text-secondary"
          >
            Clear Selection
          </button>
        </div>
      )}

      {/* Create preset modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary border border-border-default rounded-lg p-4 w-80 shadow-xl">
            <h3 className="text-sm font-medium mb-3">Create Preset</h3>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              placeholder="Preset name..."
              className="w-full mb-3"
              autoFocus
            />
            <div className="text-xs text-text-muted mb-3">
              <p>Model: {selectedModel}</p>
              <p>Temperature: {currentOptions.temperature}</p>
              <p className="truncate">Prompt: {currentPrompt.substring(0, 50)}...</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 btn btn-secondary text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreatePreset}
                disabled={!newPresetName.trim()}
                className="flex-1 btn btn-primary text-sm"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
