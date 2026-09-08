import { useStore } from '../stores/appStore';
import type { ModelOptions } from '../types';

interface NumericOptionDefinition {
  key: keyof Pick<ModelOptions, 'temperature' | 'top_p' | 'top_k' | 'num_predict' | 'num_ctx' | 'repeat_penalty'>;
  label: string;
  min: number;
  max: number;
  step: number;
  fallback: number;
  description: string;
}

const optionDefinitions: NumericOptionDefinition[] = [
  { key: 'temperature', label: 'Temperature', min: 0, max: 2, step: 0.1, fallback: 0.7, description: 'Randomness of output' },
  { key: 'top_p', label: 'Top P', min: 0, max: 1, step: 0.05, fallback: 0.9, description: 'Nucleus sampling' },
  { key: 'top_k', label: 'Top K', min: 1, max: 100, step: 1, fallback: 40, description: 'Top K sampling' },
  { key: 'num_predict', label: 'Max Tokens', min: 64, max: 4096, step: 64, fallback: 1024, description: 'Maximum response length' },
  { key: 'num_ctx', label: 'Context', min: 512, max: 32768, step: 512, fallback: 4096, description: 'Context window size' },
  { key: 'repeat_penalty', label: 'Repeat Penalty', min: 0.5, max: 2, step: 0.1, fallback: 1, description: 'Repetition penalty' },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function OptionsPanel() {
  const { currentOptions, setCurrentOptions, selectedModel } = useStore();

  const updateNumberOption = (key: NumericOptionDefinition['key'], rawValue: string, min: number, max: number) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    setCurrentOptions({ ...currentOptions, [key]: clamp(parsed, min, max) });
  };

  const updateSeed = (rawValue: string) => {
    const parsed = Number(rawValue);
    if (!Number.isFinite(parsed)) return;
    setCurrentOptions({ ...currentOptions, seed: Math.max(-1, Math.trunc(parsed)) });
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="panel-header">
        <span className="text-sm font-medium">Options</span>
        <button
          onClick={() => setCurrentOptions({
            temperature: 0.7,
            top_p: 0.9,
            top_k: 40,
            num_predict: 1024,
            num_ctx: 4096,
          })}
          className="text-xs px-2 py-1 hover:bg-bg-tertiary rounded text-text-secondary"
        >
          Reset
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        <div className="p-2 bg-bg-tertiary/50 rounded">
          <span className="text-xs text-text-muted">Model</span>
          <p className="text-sm font-mono">{selectedModel}</p>
        </div>

        {optionDefinitions.map(({ key, label, min, max, step, fallback, description }) => {
          const value = currentOptions[key] ?? fallback;
          return (
            <div key={key} className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-text-secondary">{label}</label>
                <input
                  type="number"
                  value={value}
                  onChange={(event) => updateNumberOption(key, event.target.value, min, max)}
                  min={min}
                  max={max}
                  step={step}
                  className="w-20 text-right bg-bg-tertiary border border-border-default rounded px-2 py-0.5 text-xs font-mono"
                />
              </div>
              <input
                type="range"
                value={value}
                onChange={(event) => updateNumberOption(key, event.target.value, min, max)}
                min={min}
                max={max}
                step={step}
                className="w-full h-1.5 bg-bg-tertiary rounded-full appearance-none cursor-pointer accent-accent-primary"
              />
              <p className="text-xs text-text-muted">{description}</p>
            </div>
          );
        })}

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-text-secondary">Seed</label>
            <div className="flex items-center gap-1">
              <input
                type="number"
                min={-1}
                value={currentOptions.seed ?? -1}
                onChange={(event) => updateSeed(event.target.value)}
                className="w-24 text-right bg-bg-tertiary border border-border-default rounded px-2 py-0.5 text-xs font-mono"
              />
              <button
                onClick={() => setCurrentOptions({ ...currentOptions, seed: Math.floor(Math.random() * 1000000) })}
                className="p-1 hover:bg-bg-tertiary rounded text-text-secondary"
                title="Random seed"
              >
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>
          <p className="text-xs text-text-muted">-1 for random, or set specific seed</p>
        </div>

        <div className="p-2 bg-bg-tertiary/30 rounded border border-border-default">
          <span className="text-xs text-text-muted block mb-1">Configuration Summary</span>
          <pre className="text-xs font-mono text-text-secondary overflow-x-auto">
            {JSON.stringify(currentOptions, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
