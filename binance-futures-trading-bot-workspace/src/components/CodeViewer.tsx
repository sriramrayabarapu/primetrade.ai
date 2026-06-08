import { Save, RefreshCw, FileText, CheckCircle2, AlertTriangle } from "lucide-react";
import { useState, useEffect } from "react";

interface CodeViewerProps {
  filePath: string;
  code: string;
  onCodeChange: (filePath: string, newCode: string) => void;
  onResetToDefault: (filePath: string) => void;
}

export function CodeViewer({ filePath, code, onCodeChange, onResetToDefault }: CodeViewerProps) {
  const [localCode, setLocalCode] = useState(code);
  const [isSaved, setIsSaved] = useState(false);
  const [saveBanner, setSaveBanner] = useState(false);

  useEffect(() => {
    setLocalCode(code);
    setIsSaved(false);
  }, [filePath, code]);

  const handleSave = () => {
    onCodeChange(filePath, localCode);
    setIsSaved(true);
    setSaveBanner(true);
    setTimeout(() => {
      setSaveBanner(false);
    }, 2500);
  };

  const handleReset = () => {
    if (confirm(`Are you sure you want to revert changes on ${filePath} to default?`)) {
      onResetToDefault(filePath);
      setIsSaved(true);
    }
  };

  // Determine language for display
  const getLanguageLabel = () => {
    if (filePath.endsWith(".py")) return "Python 3.x";
    if (filePath.endsWith(".txt")) return "pip requirements";
    if (filePath.endsWith(".md")) return "Markdown Documentation";
    return "Log file";
  };

  // Set line numbers
  const lines = localCode.split("\n");

  const isReadOnly = filePath === "logs/bot.log";

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-xl">
      {/* Code Header Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <FileText className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold text-slate-200">{filePath}</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono">
            {getLanguageLabel()}
          </span>
          {isReadOnly && (
            <span className="text-[10px] bg-red-950 text-red-400 border border-red-900/60 px-1.5 py-0.5 rounded font-mono font-medium">
              Read-Only Logs
            </span>
          )}
        </div>

        <div className="flex items-center space-x-2">
          {saveBanner && (
            <span className="text-[11px] font-mono text-emerald-400 flex items-center space-x-1 animate-fade-in mr-2">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Workspace Updated!</span>
            </span>
          )}

          {!isReadOnly && (
            <>
              <button
                type="button"
                id="reset-code-btn"
                onClick={handleReset}
                className="px-2.5 py-1 text-[11px] font-mono font-medium text-slate-400 hover:text-slate-100 hover:bg-slate-850 rounded transition-all flex items-center space-x-1.5 cursor-pointer"
                title="Reset this file to base template"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              
              <button
                type="button"
                id="save-code-btn"
                onClick={handleSave}
                disabled={localCode === code}
                className={`px-3 py-1 text-[11px] font-mono font-medium rounded transition-all flex items-center space-x-1.5 cursor-pointer ${
                  localCode === code
                    ? "bg-slate-850 text-slate-500 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-slate-50 font-semibold shadow-md active:bg-emerald-700"
                }`}
              >
                <Save className="w-3 h-3" />
                <span>Save Code</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Editor Content Area */}
      <div className="flex-1 flex overflow-hidden font-mono text-xs text-slate-300 relative">
        {/* Line Numbers Sider */}
        <div className="bg-slate-950/40 select-none text-right pr-3 pl-4 py-4 text-slate-600 border-r border-slate-850 min-w-[3.5rem]">
          {lines.map((_, idx) => (
            <div key={idx} className="h-5 leading-5 text-[11px]">
              {idx + 1}
            </div>
          ))}
        </div>

        <div className="flex-grow relative h-full">
          {isReadOnly ? (
            <pre className="w-full h-full bg-slate-900/40 p-4 overflow-y-auto font-mono text-[11px] leading-5 text-slate-300 whitespace-pre-wrap select-text">
              {localCode || "[Empty Log records file. Execute bot orders to generate dynamic logging output.]"}
            </pre>
          ) : (
            <textarea
              id="raw-code-editor"
              value={localCode}
              onChange={(e) => {
                setLocalCode(e.target.value);
                setIsSaved(false);
              }}
              spellCheck={false}
              className="w-full h-full bg-slate-900/10 p-4 leading-5 text-[11px] font-mono text-slate-200 resize-none outline-none focus:ring-0 overflow-y-auto select-text selection:bg-emerald-500/20"
              placeholder={`Write perfect implementation code for ${filePath}...`}
            />
          )}
        </div>
      </div>

      {!isReadOnly && localCode !== code && (
        <div className="bg-amber-950/20 border-t border-amber-900/40 px-4 py-2 flex items-center space-x-2 text-[11px] text-amber-300/90 font-mono">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>You have unsaved edits in this file. Click "Save Code" to apply to export zip.</span>
        </div>
      )}
    </div>
  );
}
