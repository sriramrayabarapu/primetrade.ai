import { FileClock, Search, ArrowDownToLine, RefreshCw, Filter, Trash2 } from "lucide-react";
import { useState } from "react";

interface LogViewerProps {
  logsContent: string;
  onClearLogs: () => void;
  onDownloadLogs: () => void;
}

export function LogViewer({ logsContent, onClearLogs, onDownloadLogs }: LogViewerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<"ALL" | "INFO" | "ERROR">("ALL");

  // Format log content into list of line objects
  const parseLogs = () => {
    if (!logsContent) return [];
    
    return logsContent
      .split("\n")
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // [2026-06-08 14:06:54] INFO [BinanceClient:87] - Outgoing HTTP...
        const regex = /^\[([^\]]+)\]\s+([A-Z]+)\s+\[([^\]]+)\]\s+-\s+(.*)$/;
        const match = line.match(regex);
        
        if (match) {
          return {
            timestamp: match[1],
            level: match[2],
            logger: match[3],
            message: match[4],
            raw: line,
          };
        }
        
        // Fallback for custom or unaligned logs
        return {
          timestamp: "",
          level: line.includes("ERROR") ? "ERROR" : "INFO",
          logger: "System",
          message: line,
          raw: line,
        };
      });
  };

  const parsedLines = parseLogs();

  // Filter lines
  const filteredLines = parsedLines.filter((line) => {
    const matchesSearch =
      line.raw.toLowerCase().includes(searchQuery.toLowerCase()) ||
      line.message.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesLevel = levelFilter === "ALL" || line.level === levelFilter;
    
    return matchesSearch && matchesLevel;
  });

  const getLevelBadgeStyles = (level: string) => {
    switch (level) {
      case "ERROR":
        return "bg-rose-500/10 text-rose-400 border-rose-500/20";
      case "WARNING":
        return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "DEBUG":
        return "bg-slate-800 text-slate-400 border-slate-700";
      default:
        return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-xl overflow-hidden flex flex-col h-full shadow-xl">
      {/* Log Header Tab Bar */}
      <div className="bg-slate-950 px-4 py-3 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2.5">
          <FileClock className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-bold text-slate-205">logs/bot.log</span>
          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">
            Rotating Logger File
          </span>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <button
            type="button"
            id="clear-logs-btn"
            onClick={onClearLogs}
            className="px-2 py-1 text-[10px] font-mono font-medium text-slate-500 hover:text-slate-300 rounded transition-all flex items-center space-x-1 uppercase cursor-pointer"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear Entries</span>
          </button>
          
          <button
            type="button"
            id="download-logs-btn"
            onClick={onDownloadLogs}
            className="px-3 py-1 text-[11px] font-sans font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-md rounded-md active:scale-95 transition-all flex items-center space-x-1.5 cursor-pointer"
          >
            <ArrowDownToLine className="w-3.5 h-3.5" />
            <span>Save .log File</span>
          </button>
        </div>
      </div>

      {/* Log Filter & Search bar */}
      <div className="p-3 bg-slate-900/40 border-b border-slate-800 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="w-full sm:w-72 relative">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-2.5" />
          <input
            type="text"
            placeholder="Search matching logs entries..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-md pl-8 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-600 font-mono outline-none focus:ring-1 focus:ring-emerald-500/40 focus:border-emerald-500/40"
          />
        </div>

        {/* Level Filters toggle */}
        <div className="flex items-center space-x-1.5 font-mono text-[10px]">
          <span className="text-slate-500 uppercase flex items-center mr-1">
            <Filter className="w-3 h-3 mr-1" />
            <span>Type:</span>
          </span>
          <button
            type="button"
            onClick={() => setLevelFilter("ALL")}
            className={`px-2 py-1 rounded cursor-pointer ${
              levelFilter === "ALL" ? "bg-slate-800 text-slate-200" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            ALL
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("INFO")}
            className={`px-2 py-1 rounded cursor-pointer ${
              levelFilter === "INFO" ? "bg-blue-600/15 text-blue-400" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            INFO
          </button>
          <button
            type="button"
            onClick={() => setLevelFilter("ERROR")}
            className={`px-2 py-1 rounded cursor-pointer ${
              levelFilter === "ERROR" ? "bg-rose-600/15 text-rose-450" : "text-slate-500 hover:text-slate-300"
            }`}
          >
            ERROR
          </button>
        </div>
      </div>

      {/* Logs Records Render */}
      <div className="flex-1 bg-slate-950/40 p-4 overflow-y-auto space-y-1.5 font-mono text-[10px] max-h-[22rem] min-h-[12rem] select-text">
        {filteredLines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center p-8 text-center text-slate-600 font-mono select-none">
            <p>No matching record entry found.</p>
            {logsContent.length === 0 && (
              <p className="text-[9px] text-slate-705 mt-1">
                Logs reside standard within logs/bot.log. Running your orders adds dynamic timestamps tracks here.
              </p>
            )}
          </div>
        ) : (
          filteredLines.map((line, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-start space-y-1 sm:space-y-0 sm:space-x-3 py-1.5 px-2 rounded hover:bg-slate-900 border border-transparent hover:border-slate-850/40 transition-all font-mono"
            >
              {/* Log level pill */}
              <span
                className={`px-1.5 py-0.5 rounded border text-[8px] font-bold text-center shrink-0 w-12 tracking-wide block uppercase ${getLevelBadgeStyles(
                  line.level
                )}`}
              >
                {line.level}
              </span>

              {/* Timestamp info */}
              {line.timestamp && (
                <span className="text-slate-500 text-[9.5px] select-all shrink-0">
                  {line.timestamp}
                </span>
              )}

              {/* Logger source offset */}
              {line.logger && (
                <span className="text-slate-550 italic font-medium shrink-0">
                  [{line.logger}]
                </span>
              )}

              {/* Core message */}
              <span className={`text-slate-200 select-all overflow-x-auto whitespace-pre ${
                line.level === "ERROR" ? "text-rose-355 font-semibold" : "text-slate-300"
              }`}>
                {line.message}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Info status metadata */}
      <div className="bg-slate-950 px-4 py-2 text-[9px] text-slate-600 font-mono border-t border-slate-900 flex items-center justify-between">
        <span>Displaying {filteredLines.length} out of {parsedLines.length} trace items</span>
        <span>Format matching: [RotatingFileHandler]</span>
      </div>
    </div>
  );
}
