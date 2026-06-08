import { useState, useEffect, FormEvent } from "react";
import { Terminal, Lock, Unlock, Eye, EyeOff, ShieldCheck, Play, Sparkles } from "lucide-react";
import { SymbolTicker } from "./SymbolTicker";

interface CommandLineFormProps {
  apiKey: string;
  apiSecret: string;
  onCredentialsChange: (key: string, secret: string) => void;
  onExecute: (args: {
    symbol: string;
    side: "BUY" | "SELL";
    type: "MARKET" | "LIMIT" | "STOP_LIMIT";
    quantity: number;
    price?: number;
    stopPrice?: number;
    mode: "simulated" | "live";
  }) => void;
  isRunning: boolean;
}

export function CommandLineForm({
  apiKey,
  apiSecret,
  onCredentialsChange,
  onExecute,
  isRunning
}: CommandLineFormProps) {
  // Input parameters
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [side, setSide] = useState<"BUY" | "SELL">("BUY");
  const [type, setType] = useState<"MARKET" | "LIMIT" | "STOP_LIMIT">("MARKET");
  const [quantity, setQuantity] = useState("0.005");
  const [price, setPrice] = useState("");
  const [stopPrice, setStopPrice] = useState("");
  const [mode, setMode] = useState<"simulated" | "live">("simulated");

  // Local credential states
  const [localKey, setLocalKey] = useState(apiKey);
  const [localSecret, setLocalSecret] = useState(apiSecret);
  const [showSecret, setShowSecret] = useState(false);
  const [credentialsLocked, setCredentialsLocked] = useState(false);

  // Sync state if changed externally
  useEffect(() => {
    setLocalKey(apiKey);
    setLocalSecret(apiSecret);
    if (apiKey && apiSecret) {
      setCredentialsLocked(true);
    }
  }, [apiKey, apiSecret]);

  const handleSaveCredentials = () => {
    if (credentialsLocked) {
      setCredentialsLocked(false);
    } else {
      onCredentialsChange(localKey, localSecret);
      setCredentialsLocked(true);
    }
  };

  const handlePriceSelect = (marketPrice: number) => {
    setPrice(marketPrice.toString());
    // Auto populate reasonable stop price if STOP_LIMIT is selected
    if (type === "STOP_LIMIT") {
      const offset = side === "BUY" ? 50 : -50;
      setStopPrice((marketPrice + offset).toString());
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === "live" && (!localKey || !localSecret)) {
      alert("Please provide your Binance Futures Testnet API Key and Secret to run in Live Testnet mode.");
      return;
    }

    onExecute({
      symbol: symbol.trim().toUpperCase(),
      side,
      type,
      quantity: parseFloat(quantity) || 0,
      price: type !== "MARKET" ? parseFloat(price) || undefined : undefined,
      stopPrice: type === "STOP_LIMIT" ? parseFloat(stopPrice) || undefined : undefined,
      mode
    });
  };

  // Build CLI command representation for preview
  const generateCommandString = () => {
    const symbolOption = `--symbol ${symbol.toUpperCase()}`;
    const sideOption = `--side ${side}`;
    const typeOption = `--type ${type}`;
    const quantityOption = `--quantity ${quantity}`;
    const priceOption = type !== "MARKET" && price ? ` --price ${price}` : "";
    const stopPriceOption = type === "STOP_LIMIT" && stopPrice ? ` --stop-price ${stopPrice}` : "";
    
    let base = `python cli.py ${symbolOption} ${sideOption} ${typeOption} ${quantityOption}${priceOption}${stopPriceOption}`;
    if (mode === "live") {
      base += " --api-key <TESTNET_API_KEY> --api-secret <TESTNET_API_SECRET>";
    }
    return base;
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800 rounded-xl p-6 shadow-xl flex flex-col space-y-5">
      
      {/* Target Operations Modes */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <h3 className="text-xs font-bold font-mono uppercase text-white tracking-widest">Place Order</h3>
        </div>
        <div className="bg-slate-950 p-1 rounded-lg border border-slate-800 flex space-x-1 font-mono text-[11px]">
          <button
            type="button"
            id="mode-simulated-btn"
            onClick={() => setMode("simulated")}
            className={`px-2.5 py-1 rounded-md transition-all duration-150 cursor-pointer ${
              mode === "simulated"
                ? "bg-slate-800 text-emerald-400 font-semibold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Offline Sim
          </button>
          <button
            type="button"
            id="mode-live-btn"
            onClick={() => setMode("live")}
            className={`px-2.5 py-1 rounded-md transition-all duration-150 flex items-center space-x-1 cursor-pointer ${
              mode === "live"
                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold text-xs"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Sparkles className="w-3 h-3 text-emerald-400" />
            <span>Live Testnet Proxy</span>
          </button>
        </div>
      </div>

      {/* Symbol Live Ticker Price Widget */}
      <SymbolTicker symbol={symbol} onPriceSelect={handlePriceSelect} />

      <form onSubmit={handleSubmit} className="space-y-4 font-sans text-sm">
        
        {/* API Credentials Lock Panel for Proxy routing */}
        {mode === "live" && (
          <div className="bg-slate-950 p-4 rounded-xl border border-dashed border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-400 flex items-center font-mono space-x-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>BINANCE TESTNET REQUISITES</span>
              </span>
              <button
                type="button"
                id="credentials-lock-btn"
                onClick={handleSaveCredentials}
                className="text-[10px] font-mono hover:text-slate-200 text-slate-400 flex items-center space-x-1 uppercase cursor-pointer"
              >
                {credentialsLocked ? (
                  <>
                    <Unlock className="w-3 h-3" />
                    <span>Unlock Fields</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3 h-3" />
                    <span>Lock & Store</span>
                  </>
                )}
              </button>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div>
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Testnet API Key (USDT-M)</label>
                <input
                  type="text"
                  value={localKey}
                  placeholder="Paste Binance Testnet API Key"
                  onChange={(e) => setLocalKey(e.target.value)}
                  disabled={credentialsLocked}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 placeholder-slate-600 outline-none text-xs disabled:opacity-60 disabled:bg-slate-950/80"
                />
              </div>
              <div className="relative">
                <label className="block text-[10px] text-slate-500 mb-1 uppercase font-semibold">Testnet Secret Key</label>
                <div className="flex items-center">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={localSecret}
                    onChange={(e) => setLocalSecret(e.target.value)}
                    placeholder="Paste Binance Testnet API Secret"
                    disabled={credentialsLocked}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-2.5 pr-8 py-1.5 text-slate-100 placeholder-slate-600 outline-none text-xs disabled:opacity-60 disabled:bg-slate-950/80"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecret(!showSecret)}
                    className="absolute right-2 top-6 text-slate-500 hover:text-slate-300 cursor-pointer"
                  >
                    {showSecret ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              {!credentialsLocked && (
                <div className="text-[10px] text-slate-500 font-mono italic leading-relaxed pt-1">
                  Credentials are proxy-routed server-side straight to Binance Futures testnet. They reside only in session.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input parameters container */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* Symbol selection */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Symbol</label>
            <select
              value={symbol}
              id="symbol-option-select"
              onChange={(e) => setSymbol(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono font-semibold rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all cursor-pointer"
            >
              <option value="BTCUSDT">BTCUSDT</option>
              <option value="ETHUSDT">ETHUSDT</option>
              <option value="BNBUSDT">BNBUSDT</option>
              <option value="SOLUSDT">SOLUSDT</option>
              <option value="XRPUSDT">XRPUSDT</option>
              <option value="ADAUSDT">ADAUSDT</option>
            </select>
          </div>

          {/* Trade Side BUY/SELL */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Trade Side</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                id="side-buy-btn"
                onClick={() => setSide("BUY")}
                className={`py-2 rounded-md text-xs font-bold font-mono cursor-pointer transition-all ${
                  side === "BUY"
                    ? "bg-emerald-500/10 border border-emerald-500/50 text-emerald-400"
                    : "bg-slate-800 border border-slate-700 text-slate-400 opacity-50 hover:opacity-80"
                }`}
              >
                BUY
              </button>
              <button
                type="button"
                id="side-sell-btn"
                onClick={() => setSide("SELL")}
                className={`py-2 rounded-md text-xs font-bold font-mono cursor-pointer transition-all ${
                  side === "SELL"
                    ? "bg-rose-500/10 border border-rose-500/50 text-rose-450"
                    : "bg-slate-800 border border-slate-700 text-slate-400 opacity-50 hover:opacity-80"
                }`}
              >
                SELL
              </button>
            </div>
          </div>

          {/* Order Type Pills */}
          <div className="col-span-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Order Type</label>
            <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 border border-slate-800 rounded-lg">
              {(["MARKET", "LIMIT", "STOP_LIMIT"] as const).map((t) => (
                <button
                  type="button"
                  key={t}
                  id={`type-${t.toLowerCase()}-btn`}
                  onClick={() => setType(t)}
                  className={`text-[11px] font-bold py-1.5 rounded-md font-mono cursor-pointer transition-all ${
                    type === t
                      ? "bg-slate-800 text-emerald-400 font-bold border border-emerald-500/20 shadow-sm"
                      : "text-slate-450 hover:text-slate-205 hover:bg-slate-900/60"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity parameter */}
          <div>
            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Quantity</label>
            <input
              type="number"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600"
              placeholder="e.g. 0.005"
              required
            />
          </div>

          {/* Limit Price - rendered conditional on LIMIT or STOP_LIMIT */}
          {type !== "MARKET" ? (
            <div>
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Limit Price (USDT)</label>
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                placeholder="Limit target price"
                required
              />
            </div>
          ) : (
            <div className="bg-slate-950/60 rounded-md p-3 border border-slate-800 flex items-center justify-center">
              <span className="text-[10px] font-mono text-slate-500 leading-relaxed text-center">
                Market Order fills immediately at best execution index.
              </span>
            </div>
          )}

          {/* Trigger Stop Price - rendered conditional on STOP_LIMIT */}
          {type === "STOP_LIMIT" && (
            <div className="col-span-2">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1.5">Stop Trigger Price (USDT)</label>
              <input
                type="number"
                step="any"
                value={stopPrice}
                onChange={(e) => setStopPrice(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono rounded-md px-3 py-2 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                placeholder="Stop activation price"
                required
              />
              <span className="text-[9px] font-mono text-slate-500 block mt-1">
                Order will convert to a standard LIMIT action once index hits stop.
              </span>
            </div>
          )}

        </div>

        {/* Live Command Line preview */}
        <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/85">
          <div className="text-[10px] text-emerald-400 font-mono font-bold mb-1.5 uppercase flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping" />
            <span>CLI Arguments Preview</span>
          </div>
          <div className="p-2.5 bg-slate-900 rounded border border-slate-800/60 overflow-x-auto">
            <code className="text-[11px] font-mono text-slate-200 select-all font-semibold whitespace-nowrap block">
              {generateCommandString()}
            </code>
          </div>
        </div>

        {/* Action Button */}
        <button
          type="submit"
          id="execute-command-btn"
          disabled={isRunning}
          className={`w-full py-3.5 rounded-md text-slate-950 text-xs font-bold font-sans tracking-widest flex items-center justify-center space-x-2.5 transition-colors cursor-pointer ${
            isRunning
              ? "bg-slate-850 text-slate-500 cursor-not-allowed"
              : side === "BUY"
                  ? "bg-emerald-500 hover:bg-emerald-400"
                  : "bg-rose-500 hover:bg-rose-450"
          }`}
        >
          {isRunning ? (
            <>
              <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
              <span>TRANSMITTING ORDER PAYLOAD...</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current shrink-0" />
              <span>RUN PYTHON BOT ORDER</span>
            </>
          )}
        </button>

        {/* Testnet Balance */}
        <div className="border-t border-slate-800 pt-5 mt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-slate-400 font-sans">Sandbox Testnet Balance</span>
            <span className="text-xs font-mono font-bold text-white">$ 14,205.82 USDT</span>
          </div>
          <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div className="bg-emerald-500 h-1.5 rounded-full w-2/3 animate-pulse"></div>
          </div>
        </div>

      </form>
    </div>
  );
}
