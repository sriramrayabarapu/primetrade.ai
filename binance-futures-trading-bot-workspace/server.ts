import express from "express";
import path from "path";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";

const app = express();
const PORT = 3000;

app.use(express.json());

// API Route: Ticker Price fetching to show actual live market prices in the simulator
app.get("/api/binance/ticker", async (req, res) => {
  try {
    const symbol = req.query.symbol || "BTCUSDT";
    // We can fetch from live or testnet. Let's fetch from live or testnet futures ticker
    const testnetUrl = `https://testnet.binancefuture.com/fapi/v1/ticker/price?symbol=${symbol}`;
    const response = await fetch(testnetUrl);
    
    if (!response.ok) {
      // Fallback to live futures ticker if testnet fails or doesn't have the coin
      const liveUrl = `https://fapi.binance.com/fapi/v1/ticker/price?symbol=${symbol}`;
      const liveResponse = await fetch(liveUrl);
      const data = await liveResponse.json();
      return res.json(data);
    }
    
    const data = await response.json();
    return res.json(data);
  } catch (error: any) {
    console.error("Error fetching ticker:", error);
    res.status(500).json({ error: "Failed to fetch symbol ticker price from Binance Testnet", details: error.message });
  }
});

// API Route: Secure Proxy Order Placement with Server-Side HMAC SHA256 Signing
app.post("/api/binance/order", async (req, res) => {
  try {
    const { apiKey, apiSecret, symbol, side, type, quantity, price, stopPrice, extraParams } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({
        error: "Missing Credentials",
        message: "API Key and API Secret are required to place real signed orders on Binance Testnet."
      });
    }

    if (!symbol || !side || !type || !quantity) {
      return res.status(400).json({
        error: "Missing Parameters",
        message: "Symbol, Side, Type, and Quantity are required fields config."
      });
    }

    // Prepare parameters for Binance Futures order
    // Reference: binance-docs.github.io/apidocs/futures/en/#new-order-trade
    const timestamp = Date.now();
    
    const paramsList: string[] = [];
    paramsList.push(`symbol=${symbol.toUpperCase()}`);
    paramsList.push(`side=${side.toUpperCase()}`);
    paramsList.push(`type=${type.toUpperCase()}`);
    paramsList.push(`quantity=${quantity}`);
    
    if (type.toUpperCase() === "LIMIT") {
      if (!price) {
        return res.status(400).json({ error: "Missing Price", message: "Price is required for LIMIT orders." });
      }
      paramsList.push(`price=${price}`);
      paramsList.push("timeInForce=GTC"); // Good 'til Cancelled standard
    }

    if (type.toUpperCase() === "STOP_LIMIT" || type.toUpperCase() === "STOP") {
      if (!stopPrice) {
        return res.status(400).json({ error: "Missing stopPrice", message: "stopPrice is required for stop-limit orders." });
      }
      paramsList.push(`stopPrice=${stopPrice}`);
      if (type.toUpperCase() === "STOP_LIMIT") {
        if (!price) {
          return res.status(400).json({ error: "Missing Price", message: "Price is required for STOP_LIMIT order types." });
        }
        paramsList.push(`price=${price}`);
        paramsList.push("timeInForce=GTC");
      }
    }

    // Support optional extra parameters (like clientOrderId, etc.)
    if (extraParams && typeof extraParams === "object") {
      Object.entries(extraParams).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
          paramsList.push(`${k}=${v}`);
        }
      });
    }

    // Append timestamp
    paramsList.push(`timestamp=${timestamp}`);
    paramsList.push("recvWindow=6000"); // Add wiggle room

    const queryString = paramsList.join("&");
    
    // Generate HMAC SHA256 Signature
    const signature = crypto
      .createHmac("sha256", apiSecret)
      .update(queryString)
      .digest("hex");

    const requestUrl = `https://testnet.binancefuture.com/fapi/v1/order?${queryString}&signature=${signature}`;

    console.log(`[Proxy] Placing Binance Futures Testnet Order: ${side} ${quantity} ${symbol} @ ${type}`);

    const response = await fetch(requestUrl, {
      method: "POST",
      headers: {
        "X-MBX-APIKEY": apiKey,
        "Content-Type": "application/x-www-form-urlencoded"
      }
    });

    const data = await response.json();

    // Log response detail
    console.log(`[Proxy] Response code: ${response.status}`, data);

    // Forward the status code and Binance response JSON
    res.status(response.status).json(data);
  } catch (error: any) {
    console.error("Error in Binance Order Proxy:", error);
    res.status(500).json({
      code: -9999,
      msg: "Internal Proxy Error while processing the order request.",
      details: error.message
    });
  }
});

// API Route: Secure Proxy Fetch Account Information
app.post("/api/binance/account", async (req, res) => {
  try {
    const { apiKey, apiSecret } = req.body;

    if (!apiKey || !apiSecret) {
      return res.status(400).json({ error: "API Credentials Required" });
    }

    const timestamp = Date.now();
    const queryString = `timestamp=${timestamp}&recvWindow=6000`;
    const signature = crypto.createHmac("sha256", apiSecret).update(queryString).digest("hex");
    const requestUrl = `https://testnet.binancefuture.com/fapi/v2/account?${queryString}&signature=${signature}`;

    const response = await fetch(requestUrl, {
      method: "GET",
      headers: {
        "X-MBX-APIKEY": apiKey
      }
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error: any) {
    res.status(500).json({ error: "Failed to fetch account info from testnet", details: error.message });
  }
});

// Configure Vite or Static Files Middleware
const startServer = async () => {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express] Server loaded and serving port ${PORT}`);
  });
};

startServer();
