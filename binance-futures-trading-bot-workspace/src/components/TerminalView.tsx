import { useEffect, useRef, useState } from "react";
import { Terminal, Trash2, ShieldAlert, Monitor, Sparkles } from "lucide-react";
import { TerminalLine } from "../types";

interface TerminalViewProps {
  lines: TerminalLine[];
  onClear: () => void;
}

export function TerminalView({ lines, onClear }: TerminalViewProps) {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new log line appends
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [lines]);

  const getLineStyles = (type: TerminalLine["type"]) => {
    switch (type) {
      case "command":
        return "text-slate-100 font-bold flex items-center";
      case "info":
        return "text-slate-400 font-medium";
      case "success":
        return "text-emerald-400 font-semibold";
      case "error":
        return "text-rose-450 font-bold";
      case "output":
        return "text-amber-300 font-mono";
      case "system":
        return "text-purple-400/80 font-mono text-[10px]";
      default:
        return "text-slate-300";
    }
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-2xl relative">
      
      {/* Tab/Toolbar */}
      <div className="bg-slate-900/30 px-4 py-3 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <Monitor className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-[10px] font-bold text-slate-500 uppercase tracking-widest">System Engine Log</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            type="button"
            id="clear-terminal-btn"
            onClick={onClear}
            className="p-1 px-2 hover:bg-slate-800 text-slate-500 hover:text-slate-300 rounded text-[10px] font-mono flex items-center space-x-1 uppercase transition-all cursor-pointer"
            title="Wipe current console entries"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Terminal View Body */}
      <div className="flex-1 bg-slate-950 p-5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2.5 max-h-[28rem] min-h-[16rem]">
        {lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center py-10 text-slate-600 font-mono select-none">
            <Terminal className="w-10 h-10 text-slate-800 mb-2 animate-pulse" />
            <div className="text-xs font-semibold">TERMINAL LIVE SESSION READY</div>
            <div className="text-[10px] mt-1 text-slate-700 max-w-sm">
              Use the "Bot Run Controller" to execute python commands and observe detailed colored log diagnostics.
            </div>
          </div>
        ) : (
          <div className="space-y-2">
            {lines.map((line, index) => {
              const isCommand = line.type === "command";
              return (
                <div key={index} className={`whitespace-pre-wrap select-text selection:bg-emerald-500/20 ${getLineStyles(line.type)}`}>
                  {isCommand && (
                    <span className="text-emerald-500 font-bold mr-1.5 shrink-0 select-none">
                      $
                    </span>
                  )}
                  <span>{line.text}</span>
                </div>
              );
            })}
            
            {/* Blinking CLI Cursor at the very end */}
            <div className="flex items-center">
              <span className="text-emerald-500 font-bold mr-1.5 select-none">$</span>
              <span className="terminal-cursor text-xs" />
            </div>
          </div>
        )}
        <div ref={terminalEndRef} />
      </div>

      {/* Terminal Footer Info rail */}
      <div className="bg-slate-900/50 border-t border-slate-800 px-4 py-2 flex items-center justify-between text-[9px] text-slate-500 font-mono">
        <div className="flex items-center space-x-3">
          <span>Active Shell: /bin/bash</span>
          <span>•</span>
          <span>Environment: Testnet Mock SDK</span>
        </div>
        <div className="flex items-center space-x-1.5 text-emerald-400 font-semibold uppercase">
          <span className="w-1.5 h-1.5 bg-emerald-450 rounded-full animate-pulse" />
          <span>STDOUT STREAMING</span>
        </div>
      </div>
    </div>
  );
}
