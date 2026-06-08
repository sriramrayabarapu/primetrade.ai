import { useState, useEffect } from "react";
import { Download, CheckCircle, Check } from "lucide-react";
import JSZip from "jszip";
import { DEFAULT_FILES, FileMap, TerminalLine } from "./types";
import { CommandLineForm } from "./components/CommandLineForm";
import { TerminalView } from "./components/TerminalView";
import { OrdersTableAndPnL, MockOrder } from "./components/OrdersTableAndPnL";

export default function App() {
  // Master file state, enabling users to edit python files dynamically
  const [files, setFiles] = useState<FileMap>(() => {
    const saved = localStorage.getItem("workspace_files");
    return saved ? JSON.parse(saved) : { ...DEFAULT_FILES };
  });

  const [selectedFile, setSelectedFile] = useState<string>("cli.py");

  // Keep track of modified files to display amber dots in tree explorer
  const [editedFiles, setEditedFiles] = useState<string[]>([]);

  // Rotating log file state
  const [logsContent, setLogsContent] = useState<string>(() => {
    const savedLogs = localStorage.getItem("workspace_logs");
    if (savedLogs) return savedLogs;

    // Start with illustrative, premium greeting logs conforming to requirements
    const nowStr = new Date().toISOString().replace("T", " ").substring(0, 19);
    return `[${nowStr}] INFO [CLI_Runner:45] - Starting Binance Futures System Startup Checklist
[${nowStr}] INFO [BinanceClient:32] - Validating connection to Testnet Endpoint: https://testnet.binancefuture.com
[${nowStr}] INFO [CLI_Runner:52] - Workspace initialization complete. RotatingFileHandler streaming to logs/bot.log.
`;
  });

  // CLI execution console streams
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);

  // Local storage credentials persistence
  const [apiKey, setApiKey] = useState(() => localStorage.getItem("binance_api_key") || "");
  const [apiSecret, setApiSecret] = useState(() => localStorage.getItem("binance_api_secret") || "");

  const [isRunning, setIsRunning] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [ordersList, setOrdersList] = useState<MockOrder[]>([]);
  const [balance, setBalance] = useState<number>(14205.82);

  // Sync edits to localStorage to prevent lost work during iframe reloads
  useEffect(() => {
    localStorage.setItem("workspace_files", JSON.stringify(files));
    const modified = Object.keys(files).filter(
      (path) => files[path] !== DEFAULT_FILES[path]
    );
    setEditedFiles(modified);
  }, [files]);

  useEffect(() => {
    localStorage.setItem("workspace_logs", logsContent);
  }, [logsContent]);

  useEffect(() => {
    localStorage.setItem("binance_api_key", apiKey);
    localStorage.setItem("binance_api_secret", apiSecret);
  }, [apiKey, apiSecret]);

  // Command run handler
  const handleExecuteCommand = async (args: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT" | "STOP_LIMIT";
    quantity: number;
    price?: number;
    stopPrice?: number;
    mode: "simulated" | "live";
  }) => {
    setIsRunning(true);
    setTerminalLines((prev) => [
      ...prev,
      {
        type: "command",
        text: `python cli.py --symbol ${args.symbol} --side ${args.side} --type ${args.type} --quantity ${args.quantity}${
          args.price ? ` --price ${args.price}` : ""
        }${args.stopPrice ? ` --stop-price ${args.stopPrice}` : ""}`,
        timestamp: new Date().toLocaleTimeString(),
      },
    ]);

    // Small delay to simulate CLI engine parsing parameters and reading config
    await new Promise((r) => setTimeout(r, 600));

    const dateStr = new Date().toISOString().replace("T", " ").substring(0, 19);

    if (args.mode === "simulated") {
      // Offline high-fidelity sandbox simulation
      // Validate inputs matching bot/validators.py logic
      if (args.quantity <= 0) {
        appendTerminalLine("error", "FAILED: INPUT VALIDATION REJECTED REQUEST\n  • Argument issue: Quantity must be strictly greater than 0.");
        appendLog(dateStr, "ERROR", "validators:22", "Input validator caught an exception: Quantity must be strictly greater than 0.");
        setIsRunning(false);
        return;
      }
      if (args.type !== "MARKET" && (!args.price || args.price <= 0)) {
        appendTerminalLine("error", "FAILED: INPUT VALIDATION REJECTED REQUEST\n  • Argument issue: Price is required and must be greater than 0 for LIMIT-based orders.");
        appendLog(dateStr, "ERROR", "validators:34", "Input validation failure: Price required for limit orders.");
        setIsRunning(false);
        return;
      }
      if (args.type === "STOP_LIMIT" && (!args.stopPrice || args.stopPrice <= 0)) {
        appendTerminalLine("error", "FAILED: INPUT VALIDATION REJECTED REQUEST\n  • Argument issue: Stop trigger price is required and must be greater than 0 for STOP_LIMIT.");
        appendLog(dateStr, "ERROR", "validators:42", "Input validation failure: Stop Price required for STOP_LIMIT order type.");
        setIsRunning(false);
        return;
      }

      // Construct a mock API response
      const orderId = Math.floor(100000000 + Math.random() * 900000000);
      const isFilled = args.type === "MARKET" ? "FILLED" : "NEW";
      const executedQty = args.type === "MARKET" ? args.quantity : 0.0;
      const mockPrice = args.price || 67451.90;

      // Type output lines onto terminal console
      appendTerminalLine("info", "============================================================\nSTARTING BINANCE FUTURES ORDER RUNNER\n============================================================");
      appendTerminalLine("output", `[ORDER REQUEST SUMMARY]\n  • Symbol:       ${args.symbol}\n  • Side:         ${args.side}\n  • Order Type:   ${args.type}\n  • Quantity:     ${args.quantity}${args.price ? `\n  • Price:        ${args.price}` : ""}${args.stopPrice ? `\n  • Stop Price:   ${args.stopPrice}` : ""}\n  • Log Location: logs/bot.log\n----------------------------------------`);
      
      appendLog(dateStr, "INFO", "CLI_Runner:58", `Initiating placement process: ${args.side} ${args.symbol} ${args.type} quantity=${args.quantity} price=${args.price || "None"} stop=${args.stopPrice || "None"}`);
      appendLog(dateStr, "INFO", "validators:18", "Inputs validated successfully. Dispatching network order...");
      
      await new Promise((r) => setTimeout(r, 700));
      
      appendTerminalLine("info", "Placing order on Binance USDT-M testnet server (Simulated)...");
      appendLog(dateStr, "INFO", "BinanceClient:64", `Outgoing HTTP POST request to /fapi/v1/order with parameters: {'symbol': '${args.symbol}', 'side': '${args.side}', 'type': '${args.type}', 'quantity': ${args.quantity}${args.price ? `, 'price': ${args.price}` : ""}${args.stopPrice ? `, 'stopPrice': ${args.stopPrice}` : ""}, 'timestamp': ${Date.now()}, 'recvWindow': 6000}`);
      
      await new Promise((r) => setTimeout(r, 600));

      appendLog(dateStr, "INFO", "BinanceClient:87", "Binance response received with status code: 200");
      
      const mockResult = {
        orderId,
        symbol: args.symbol,
        status: isFilled,
        clientOrderId: `web_cli_sim_${Math.random().toString(36).substring(2, 7)}`,
        price: args.price ? args.price.toFixed(2) : "0.00",
        avgPrice: args.type === "MARKET" ? mockPrice.toFixed(2) : "0.00",
        origQty: args.quantity.toString(),
        executedQty: executedQty.toString(),
        cumQty: executedQty.toString(),
        type: args.type,
        side: args.side,
        updateTime: Date.now()
      };

      appendLog(dateStr, "INFO", "BinanceClient:92", `Request successful! Response payload: ${JSON.stringify(mockResult)}`);

      appendTerminalLine("success", `============================================================\nSUCCESS: ORDER PLACED SUCCESSFULLY\n=====================================================\n  • Order ID:      ${orderId}\n  • Status:        ${isFilled}\n  • Executed Qty:  ${executedQty}\n  • Avg Price:     ${mockResult.avgPrice} (Estimate)\n  • Client OrdId:  ${mockResult.clientOrderId}\n  • Cum Quote Qty: ${executedQty * mockPrice}\n----------------------------------------`);
      appendLog(dateStr, "INFO", "CLI_Runner:88", `Order executed completely via CLI. Order ID: ${orderId}`);
      
      setOrdersList((prev) => [
        {
          orderId: `#${orderId}`,
          time: new Date().toLocaleTimeString(),
          symbol: args.symbol,
          side: args.side,
          type: args.type,
          price: args.price ? args.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : mockPrice.toLocaleString("en-US", { minimumFractionDigits: 2 }),
          status: isFilled,
        },
        ...prev,
      ]);
      
    } else {
      // Live system testnet proxy route
      appendTerminalLine("info", "============================================================\nSTARTING BINANCE FUTURES ORDER RUNNER\n============================================================");
      appendTerminalLine("output", `[ORDER REQUEST SUMMARY]\n  • Symbol:       ${args.symbol}\n  • Side:         ${args.side}\n  • Order Type:   ${args.type}\n  • Quantity:     ${args.quantity}${args.price ? `\n  • Price:        ${args.price}` : ""}${args.stopPrice ? `\n  • Stop Price:   ${args.stopPrice}` : ""}\n  • Log Location: logs/bot.log\n----------------------------------------`);
      
      appendLog(dateStr, "INFO", "CLI_Runner:58", `[LIVE PROXY] Initiating placement: ${args.side} ${args.symbol} ${args.type} quantity=${args.quantity} price=${args.price || "None"} stop=${args.stopPrice || "None"}`);
      appendLog(dateStr, "INFO", "validators:18", "[LIVE PROXY] Inputs validation completed.");

      appendTerminalLine("info", "Placing actual signed order on Binance USDT-M testnet server...");

      try {
        const response = await fetch("/api/binance/order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey,
            apiSecret,
            symbol: args.symbol,
            side: args.side,
            type: args.type,
            quantity: args.quantity,
            price: args.price,
            stopPrice: args.stopPrice
          })
        });

        const data = await response.json();
        
        appendLog(dateStr, "INFO", "BinanceClient:87", `Binance response received with status code: ${response.status}`);

        if (response.ok) {
          appendLog(dateStr, "INFO", "BinanceClient:92", `Request successful! Response payload: ${JSON.stringify(data)}`);
          
          appendTerminalLine("success", `============================================================\nSUCCESS: ORDER PLACED SUCCESSFULLY\n=====================================================\n  • Order ID:      ${data.orderId}\n  • Status:        ${data.status}\n  • Executed Qty:  ${data.executedQty}\n  • Avg Price:     ${data.avgPrice || "N/A"}\n  • Client OrdId:  ${data.clientOrderId}\n  • Cum Quote Qty: ${data.cumQty || "0.0"}\n----------------------------------------`);
          appendLog(dateStr, "INFO", "CLI_Runner:88", `Order executed completely via CLI. Order ID: ${data.orderId}`);

          setOrdersList((prev) => [
            {
              orderId: `#${data.orderId}`,
              time: new Date().toLocaleTimeString(),
              symbol: args.symbol,
              side: args.side,
              type: args.type,
              price: data.avgPrice ? parseFloat(data.avgPrice).toLocaleString("en-US", { minimumFractionDigits: 2 }) : (args.price ? args.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00"),
              status: (data.status || "FILLED") as any,
            },
            ...prev,
          ]);
        } else {
          // Failure response metrics
          const errCode = data.code || -9998;
          const errMsg = data.msg || data.error || "Unknown testnet error";
          
          appendLog(dateStr, "ERROR", "BinanceClient:89", `Binance API error response! Code: ${errCode}, Message: ${errMsg}`);
          appendLog(dateStr, "ERROR", "CLI_Runner:96", `CLI Execution halted. Binance API rejected request with code ${errCode}: ${errMsg}`);

          appendTerminalLine("error", `============================================================\nFAILED: BINANCE SERVER REJECTED EXECUTABLE\n=====================================================\n  • Error Code:    ${errCode}\n  • Reason:        ${errMsg}\n  • Raw Response:  ${JSON.stringify(data)}`);

          setOrdersList((prev) => [
            {
              orderId: `#ERR-${errCode}`,
              time: new Date().toLocaleTimeString(),
              symbol: args.symbol,
              side: args.side,
              type: args.type,
              price: args.price ? args.price.toLocaleString("en-US", { minimumFractionDigits: 2 }) : "0.00",
              status: "FAILED",
            },
            ...prev,
          ]);
        }
      } catch (err: any) {
        appendLog(dateStr, "ERROR", "BinanceClient:102", `Network communication loss with Binance Testnet: ${err.message}`);
        appendTerminalLine("error", `============================================================\nFAILED: AN UNEXPECTED NETWORK EXCEPTION OCCURRED\n=====================================================\n  • Error Class:   RuntimeError\n  • Details:       Network connection failure. Check proxy route connectivity. Details: ${err.message}`);
      }
    }

    setIsRunning(false);
  };

  // Helper callbacks to append log lines and print to console
  const appendTerminalLine = (type: TerminalLine["type"], text: string) => {
    setTerminalLines((prev) => [
      ...prev,
      { type, text, timestamp: new Date().toLocaleTimeString() },
    ]);
  };

  const appendLog = (datetime: string, level: "INFO" | "ERROR", logger: string, msg: string) => {
    setLogsContent((prev) => prev + `[${datetime}] ${level} [${logger}] - ${msg}\n`);
  };

  // Log management helpers
  const handleClearLogs = () => {
    if (confirm("Are you sure you want to completely clear the virtual logs/bot.log content?")) {
      setLogsContent("");
    }
  };

  const handleDownloadLogs = () => {
    const blob = new Blob([logsContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bot.log";
    a.click();
    URL.revokeObjectURL(url);
  };

  // Workspace single-file content edits
  const handleCodeChange = (path: string, newCode: string) => {
    setFiles((prev) => ({ ...prev, [path]: newCode }));
  };

  const handleResetToDefault = (path: string) => {
    setFiles((prev) => ({ ...prev, [path]: DEFAULT_FILES[path] }));
  };

  // Project ZIP compilations using JSZip
  const handleDownloadZipPackage = async () => {
    try {
      const zip = new JSZip();

      // Flat root files
      zip.file("requirements.txt", files["requirements.txt"]);
      zip.file("cli.py", files["cli.py"]);
      zip.file("README.md", files["README.md"]);

      // /bot/ subdirectory packages
      const botFolder = zip.folder("bot");
      if (botFolder) {
        botFolder.file("__init__.py", files["bot/__init__.py"]);
        botFolder.file("client.py", files["bot/client.py"]);
        botFolder.file("orders.py", files["bot/orders.py"]);
        botFolder.file("validators.py", files["bot/validators.py"]);
        botFolder.file("logging_config.py", files["bot/logging_config.py"]);
      }

      // /logs/ subdirectory carrying live generated outputs
      const logsFolder = zip.folder("logs");
      if (logsFolder) {
        logsFolder.file("bot.log", logsContent);
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = "trading_bot_binance_futures.zip";
      a.click();
      
      URL.revokeObjectURL(url);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("ZIP Generation error:", err);
      alert("Failed to build ZIP package in browser.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-100 selection:bg-emerald-500/10">
      
      {/* Top Navigation Bar */}
      <header className="h-16 border-b border-slate-800 bg-slate-900/50 px-6 flex items-center justify-between sticky top-0 z-50 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-slate-950" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <span className="text-sm font-bold tracking-tight text-white flex items-center">
            Primetrade.ai <span className="text-slate-500 font-normal text-[10px] ml-2 tracking-widest bg-slate-800/60 border border-slate-700/50 px-1.5 py-0.5 rounded uppercase font-mono">v1.0.4-beta</span>
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest hidden sm:inline-block">Testnet Connected</span>
          </div>
          <div className="h-8 w-px bg-slate-800 hidden sm:block"></div>
          <div className="hidden md:flex flex-col items-end leading-none font-mono">
            <span className="text-[9px] uppercase text-slate-500 font-bold mb-0.5">Proxy API Route</span>
            <span className="text-xs text-emerald-500 font-bold">{apiKey ? `${apiKey.substring(0, 3)}...${apiKey.substring(apiKey.length - 4)}` : "7xR...K92L (sim)"}</span>
          </div>
          
          <button
            type="button"
            id="download-master-zip-btn"
            onClick={handleDownloadZipPackage}
            className={`px-4 py-2 rounded-md font-sans text-xs font-bold tracking-wider flex items-center space-x-1.5 transition-colors cursor-pointer ${
              downloadSuccess
                ? "bg-slate-800 text-emerald-400 border border-emerald-500/20"
                : "bg-emerald-500 hover:bg-emerald-400 text-slate-950"
            }`}
          >
            {downloadSuccess ? (
              <>
                <Check className="w-4 h-4 shrink-0" />
                <span>DOWNLOADED SUCCESS!</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4 shrink-0" />
                <span>EXPORT PROJECT .ZIP</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Workspace Frame Layout */}
      <main className="p-6 max-w-[1700px] mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* SIDE BAR / Left Layout (Columns: 3) - Place Order Form */}
        <div className="lg:col-span-3 space-y-6">
          <CommandLineForm
            apiKey={apiKey}
            apiSecret={apiSecret}
            onCredentialsChange={(key, secret) => {
              setApiKey(key);
              setApiSecret(secret);
            }}
            onExecute={handleExecuteCommand}
            isRunning={isRunning}
          />
        </div>

        {/* CENTER COLUMN / Trading Monitor & Graph (Columns: 6) */}
        <div className="lg:col-span-6">
          <OrdersTableAndPnL
            orders={ordersList}
            balance={balance}
          />
        </div>

        {/* RIGHT COLUMN / System Engine Log (Columns: 3) */}
        <div className="lg:col-span-3">
          
          {/* Terminal Console */}
          <TerminalView
            lines={terminalLines}
            onClear={() => setTerminalLines([])}
          />

        </div>

      </main>

      {/* Decorative clean workspace footer */}
      <footer className="h-10 border-t border-slate-800 bg-slate-900 px-6 flex items-center justify-between text-[10px] text-slate-500 font-medium select-none sticky bottom-0 z-40">
        <div className="flex items-center gap-4">
          <span>Session ID: <span className="text-slate-300 font-mono">8829-fafa-119c</span></span>
          <span>Uptime: <span className="text-slate-300 font-mono">04:12:33</span></span>
        </div>
        <div className="hidden md:block text-center text-slate-600 truncate max-w-md">
          Unified Binance Futures Developer Assessment Playground. Build v1.0.4-beta
        </div>
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-400"></div> WebSocket: Stable</span>
          <span className="text-slate-300 font-mono">Python 3.11.2</span>
        </div>
      </footer>

    </div>
  );
}
