import { ArrowUpRight, ArrowDownRight, TrendingUp, DollarSign } from "lucide-react";

export interface MockOrder {
  orderId: string;
  time: string;
  symbol: string;
  side: "BUY" | "SELL";
  type: "MARKET" | "LIMIT" | "STOP_LIMIT";
  price: string;
  status: "FILLED" | "NEW" | "FAILED";
}

interface OrdersTableAndPnLProps {
  orders: MockOrder[];
  balance: number;
}

export function OrdersTableAndPnL({ orders, balance }: OrdersTableAndPnLProps) {
  // Pre-populate with typical testnet initial orders
  const defaultOrders: MockOrder[] = [
    {
      orderId: "#872194",
      time: "14:20:05",
      symbol: "BTCUSDT",
      side: "SELL",
      type: "LIMIT",
      price: "64,250.00",
      status: "FILLED",
    },
    {
      orderId: "#872181",
      time: "14:18:22",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "MARKET",
      price: "64,112.45",
      status: "FILLED",
    },
    {
      orderId: "#872170",
      time: "14:15:10",
      symbol: "BTCUSDT",
      side: "BUY",
      type: "LIMIT",
      price: "63,900.00",
      status: "NEW",
    },
  ];

  const displayedOrders = orders.length > 0 ? orders : defaultOrders;

  // Calculate quick mock PnL statistics based on history
  const totalTrades = displayedOrders.length;
  const pnlSum = displayedOrders.reduce((acc, order) => {
    if (order.status === "FAILED") return acc;
    const isBuy = order.side === "BUY";
    // Simulated quick factor
    return acc + (isBuy ? -12.40 : 18.50);
  }, 452.12);

  return (
    <div className="flex flex-col h-full space-y-6">
      {/* Upper Panel: Recent Orders table */}
      <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl flex-1 flex flex-col overflow-hidden shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">Recent Testnet Orders</h2>
          </div>
          <span className="px-2 py-1 bg-slate-800 rounded text-[10px] text-slate-400 font-mono">
            Total Trades: {totalTrades}
          </span>
        </div>

        <div className="flex-1 overflow-y-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] uppercase text-slate-500 font-bold border-b border-slate-800/80">
                <th className="pb-3">OrderID</th>
                <th className="pb-3">Time</th>
                <th className="pb-3">Symbol</th>
                <th className="pb-3">Side</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Price</th>
                <th className="pb-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="text-xs font-mono divide-y divide-slate-800/40">
              {displayedOrders.map((order, idx) => (
                <tr key={idx} className="hover:bg-slate-900/30 transition-colors">
                  <td className="py-3 text-slate-400 select-all">{order.orderId}</td>
                  <td className="py-3 text-slate-400">{order.time}</td>
                  <td className="py-3 text-white font-semibold">{order.symbol}</td>
                  <td className="py-3">
                    <span
                      className={`font-bold flex items-center space-x-1 ${
                        order.side === "BUY" ? "text-emerald-450" : "text-rose-455"
                      }`}
                    >
                      {order.side === "BUY" ? (
                        <ArrowUpRight className="w-3.5 h-3.5 inline mr-0.5 shrink-0" />
                      ) : (
                        <ArrowDownRight className="w-3.5 h-3.5 inline mr-0.5 shrink-0" />
                      )}
                      <span>{order.side}</span>
                    </span>
                  </td>
                  <td className="py-3 text-slate-300">{order.type}</td>
                  <td className="py-3 text-slate-50 font-bold">$ {order.price}</td>
                  <td className="py-3 text-right">
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        order.status === "FILLED"
                          ? "bg-emerald-500/10 text-emerald-400"
                          : order.status === "NEW"
                          ? "bg-amber-500/10 text-amber-400"
                          : "bg-rose-500/10 text-rose-400"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Lower Panel: PnL Analysis Graphic */}
      <div className="p-6 bg-slate-900/30 border border-slate-800 rounded-xl flex flex-col h-56 shadow-xl relative">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white uppercase tracking-wider">PnL Analysis</h2>
          </div>
          <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded font-mono font-bold uppercase">
            Active Simulator
          </span>
        </div>

        <div className="flex-1 bg-slate-900/50 border border-slate-800/60 rounded-xl relative flex items-end p-4 gap-2 overflow-hidden">
          {/* Animated/Rendered bar chart matching mockup aesthetic */}
          <div className="flex-grow bg-emerald-500/10 h-[25%] rounded-t-sm border-t border-emerald-500/40 relative group transition-all hover:bg-emerald-500/20">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">7d</div>
          </div>
          <div className="flex-grow bg-emerald-500/10 h-[50%] rounded-t-sm border-t border-emerald-500/40 relative group transition-all hover:bg-emerald-500/20">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">5d</div>
          </div>
          <div className="flex-grow bg-emerald-500/15 h-[35%] rounded-t-sm border-t border-emerald-500/40 relative group transition-all hover:bg-emerald-500/20">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">4d</div>
          </div>
          <div className="flex-grow bg-rose-500/10 h-[15%] rounded-t-sm border-t border-rose-500/30 relative group transition-all hover:bg-rose-500/20">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">3d</div>
          </div>
          <div className="flex-grow bg-emerald-500/30 h-[75%] rounded-t-sm border-t border-emerald-500/70 relative group transition-all hover:bg-emerald-500/40">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">2d</div>
          </div>
          <div className="flex-grow bg-emerald-500/15 h-[40%] rounded-t-sm border-t border-emerald-500/40 relative group transition-all hover:bg-emerald-500/20">
            <div className="absolute inset-x-0 bottom-full mb-1 text-[8px] font-mono text-center text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity">1d</div>
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center bg-slate-950/80 backdrop-blur-md px-5 py-3 rounded-xl border border-slate-800/80 shadow-2xl">
              <p className="text-3xl font-bold text-white font-mono tracking-tight">
                {pnlSum >= 0 ? "+" : ""}${pnlSum.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">Last 24 Hours PnL</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
