import { useStore } from '../stores/appStore';

export default function TitleBar() {
  const { panels, setPanelState } = useStore();

  const togglePanel = (id: string) => {
    setPanelState(id, { visible: !panels[id]?.visible });
  };

  return (
    <div className="h-10 bg-bg-secondary border-b border-border-default flex items-center justify-between px-2 drag-region select-none">
      <div className="flex items-center gap-3 no-drag">
        <div className="w-6 h-6 rounded bg-accent-primary/20 flex items-center justify-center">
          <span className="text-accent-primary text-sm font-bold">A</span>
        </div>
        <span className="text-sm font-medium text-text-primary">Awful Describer</span>
        <span className="text-xs text-text-muted">v1.0.0</span>
      </div>

      <div className="flex items-center gap-1 no-drag">
        <span className="text-xs text-text-muted mr-2">Panels:</span>
        {Object.entries(panels).map(([id, state]) => (
          <button
            key={id}
            onClick={() => togglePanel(id)}
            className={`px-2 py-1 text-xs rounded transition-colors ${
              state.visible 
                ? 'bg-accent-primary/20 text-accent-primary' 
                : 'bg-bg-tertiary text-text-muted hover:text-text-secondary'
            }`}
            title={`Toggle ${id} panel`}
          >
            {id.charAt(0).toUpperCase() + id.slice(1)}
          </button>
        ))}
      </div>

      <div className="flex items-center gap-1 no-drag">
        <button
          onClick={() => window.api.minimize()}
          className="w-10 h-8 flex items-center justify-center hover:bg-bg-tertiary rounded transition-colors"
          title="Minimize"
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
          </svg>
        </button>
        <button
          onClick={() => window.api.maximize()}
          className="w-10 h-8 flex items-center justify-center hover:bg-bg-tertiary rounded transition-colors"
          title="Maximize"
        >
          <svg className="w-4 h-4 text-text-secondary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
          </svg>
        </button>
        <button
          onClick={() => window.api.close()}
          className="w-10 h-8 flex items-center justify-center hover:bg-status-error/20 rounded transition-colors group"
          title="Close"
        >
          <svg className="w-4 h-4 text-text-secondary group-hover:text-status-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
}
