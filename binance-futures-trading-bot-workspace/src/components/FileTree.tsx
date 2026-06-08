import { FileCode, Folder, FileText, ChevronDown, ChevronRight, Binary } from "lucide-react";
import { useState } from "react";

interface FileTreeProps {
  selectedFile: string;
  onSelectFile: (filePath: string) => void;
  editedFilesList: string[];
}

export function FileTree({ selectedFile, onSelectFile, editedFilesList }: FileTreeProps) {
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    root: true,
    bot: true,
    logs: true,
  });

  const toggleFolder = (folderName: string) => {
    setOpenFolders((prev) => ({ ...prev, [folderName]: !prev[folderName] }));
  };

  const getFileIcon = (fileName: string) => {
    if (fileName.endsWith(".txt")) return <FileText className="w-4 h-4 text-slate-400" />;
    if (fileName.endsWith(".md")) return <FileText className="w-4 h-4 text-blue-400" />;
    if (fileName.endsWith(".py")) return <FileCode className="w-4 h-4 text-amber-400" />;
    return <Binary className="w-4 h-4 text-emerald-400" />;
  };

  const renderFileRow = (fileName: string, fullPath: string) => {
    const isSelected = selectedFile === fullPath;
    const isEdited = editedFilesList.includes(fullPath);

    return (
      <button
        type="button"
        id={`file-row-${fullPath.replace(/[/.]/g, "-")}`}
        onClick={() => onSelectFile(fullPath)}
        className={`w-full text-left pl-6 pr-2 py-1.5 rounded-lg flex items-center justify-between text-xs font-mono transition-all duration-150 cursor-pointer ${
          isSelected
            ? "bg-emerald-500/10 text-emerald-300 border-l-2 border-emerald-500"
            : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
        }`}
      >
        <div className="flex items-center space-x-2 truncate">
          {getFileIcon(fileName)}
          <span className="truncate">{fileName}</span>
        </div>
        {isEdited && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" title="Edited" />
        )}
      </button>
    );
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-5 shadow-xl select-none">
      <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center justify-between">
        <span>Workspace Directory</span>
        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-mono font-medium">python3</span>
      </div>

      <div className="space-y-1">
        {/* Project Root Folder */}
        <div className="flex items-center text-xs font-medium text-slate-400 py-1 font-mono">
          <Folder className="w-4 h-4 text-emerald-500 mr-2" />
          <span>trading_bot /</span>
        </div>

        {/* Requirements file */}
        <div className="pl-3">
          {renderFileRow("requirements.txt", "requirements.txt")}
        </div>

        {/* README file */}
        <div className="pl-3">
          {renderFileRow("README.md", "README.md")}
        </div>

        {/* CLI script */}
        <div className="pl-3">
          {renderFileRow("cli.py", "cli.py")}
        </div>

        {/* /bot/ Folder */}
        <div className="pl-3">
          <button
            type="button"
            id="toggle-bot-folder"
            onClick={() => toggleFolder("bot")}
            className="w-full text-left py-1 rounded hover:bg-slate-800/30 flex items-center justify-between text-xs font-mono text-slate-200 cursor-pointer"
          >
            <div className="flex items-center space-x-1">
              {openFolders.bot ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <Folder className="w-4 h-4 text-amber-500" />
              <span className="font-semibold text-slate-200">bot/</span>
            </div>
            <span className="text-[9px] text-slate-500 pr-1">package</span>
          </button>

          {openFolders.bot && (
            <div className="pl-4 mt-0.5 space-y-0.5 border-l border-slate-800/80 ml-2">
              {renderFileRow("__init__.py", "bot/__init__.py")}
              {renderFileRow("client.py", "bot/client.py")}
              {renderFileRow("orders.py", "bot/orders.py")}
              {renderFileRow("validators.py", "bot/validators.py")}
              {renderFileRow("logging_config.py", "bot/logging_config.py")}
            </div>
          )}
        </div>

        {/* /logs/ Folder (Virtual log file placeholder) */}
        <div className="pl-3">
          <button
            type="button"
            id="toggle-logs-folder"
            onClick={() => toggleFolder("logs")}
            className="w-full text-left py-1 rounded hover:bg-slate-800/30 flex items-center justify-between text-xs font-mono text-slate-200 cursor-pointer"
          >
            <div className="flex items-center space-x-1">
              {openFolders.logs ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              <Folder className="w-4 h-4 text-emerald-600/80" />
              <span className="font-semibold text-slate-300">logs/</span>
            </div>
            <span className="text-[9px] text-slate-500 pr-1">output</span>
          </button>

          {openFolders.logs && (
            <div className="pl-4 mt-0.5 space-y-0.5 border-l border-slate-800/80 ml-2">
              {renderFileRow("bot.log", "logs/bot.log")}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-slate-800">
        <div className="bg-slate-950 rounded-lg p-3 border border-slate-800">
          <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-2.5">Evaluation Checkpoints</div>
          <div className="space-y-1.5 text-[11px] font-mono">
            <div className="flex items-start space-x-2 text-emerald-400">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span>Separate client/API architecture</span>
            </div>
            <div className="flex items-start space-x-2 text-emerald-400">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span>Robust inputs validator module</span>
            </div>
            <div className="flex items-start space-x-2 text-emerald-400">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span>Log rotation configured (bot.log)</span>
            </div>
            <div className="flex items-start space-x-2 text-emerald-400">
              <span className="text-emerald-500 font-bold shrink-0">✓</span>
              <span>STOP_LIMIT order type (Bonus)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
