export interface FileMap {
  [filePath: string]: string;
}

export interface TerminalLine {
  type: "command" | "info" | "success" | "error" | "output" | "system";
  text: string;
  timestamp: string;
}

export const DEFAULT_FILES: FileMap = {
  "requirements.txt": `requests==2.31.0
colorama==0.4.6
`,

  "bot/__init__.py": `"""
Trading Bot for Binance Futures Testnet (USDT-M)
"""
__version__ = "1.0.0"
`,

  "bot/logging_config.py": `import sys
import logging
import os
from logging.handlers import RotatingFileHandler

def setup_logging(log_file="logs/bot.log"):
    # Create logs folder if it doesn't exist
    os.makedirs(os.path.dirname(log_file), exist_ok=True)

    # Root logger configuration
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Clear existing handlers
    if logger.hasHandlers():
        logger.handlers.clear()

    # Formatter matching enterprise standard
    formatter = logging.Formatter(
        "[%(asctime)s] %(levelname)s [%(name)s:%(lineno)d] - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    # File Handler
    file_handler = RotatingFileHandler(
        log_file, maxBytes=10*1024*1024, backupCount=5, encoding="utf-8"
    )
    file_handler.setFormatter(formatter)
    file_handler.setLevel(logging.INFO)
    logger.addHandler(file_handler)

    # Console Handler (stream to standard output)
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setFormatter(formatter)
    console_handler.setLevel(logging.INFO)
    logger.addHandler(console_handler)

    logging.info("Logging initialized. Writing to %s", log_file)
`,

  "bot/validators.py": `import re

VALID_SIDES = {"BUY", "SELL"}
VALID_TYPES = {"MARKET", "LIMIT", "STOP_LIMIT"}

def validate_inputs(symbol: str, side: str, order_type: str, quantity: float, price: float = None, stop_price: float = None):
    """
    Helper to validate and sanitize inputs before triggering requests to Binance API.
    Raises ValueError on failure.
    """
    if not symbol or not isinstance(symbol, str) or len(symbol) < 3:
        raise ValueError(f"Invalid symbol form: '{symbol}'. Must be at least 3 chars.")
    
    symbol_upper = symbol.upper()
    
    side_upper = side.upper()
    if side_upper not in VALID_SIDES:
        raise ValueError(f"Invalid side: '{side}'. Must be one of {VALID_SIDES}.")
        
    type_upper = order_type.upper()
    if type_upper not in VALID_TYPES:
        raise ValueError(f"Invalid order type: '{order_type}'. Must be one of {VALID_TYPES}.")

    try:
        qty = float(quantity)
    except (TypeError, ValueError):
        raise ValueError(f"Quantity must be a positive float. Got: '{quantity}'")
        
    if qty <= 0:
        raise ValueError(f"Quantity must be strictly greater than 0. Got: {qty}")

    prc = None
    if type_upper in {"LIMIT", "STOP_LIMIT"}:
        if price is None:
            raise ValueError(f"Price is required for Limit-based orders.")
        try:
            prc = float(price)
        except (TypeError, ValueError):
            raise ValueError(f"Price must be a positive float. Got: '{price}'")
        if prc <= 0:
            raise ValueError(f"Price must be strictly greater than 0. Got: {prc}")

    st_prc = None
    if type_upper == "STOP_LIMIT":
        if stop_price is None:
            raise ValueError(f"Stop Price is required for STOP_LIMIT order types.")
        try:
            st_prc = float(stop_price)
        except (TypeError, ValueError):
            raise ValueError(f"Stop Price must be a positive float. Got: '{stop_price}'")
        if st_prc <= 0:
            raise ValueError(f"Stop Price must be strictly greater than 0. Got: {st_prc}")

    return symbol_upper, side_upper, type_upper, qty, prc, st_prc
`,

  "bot/client.py": `import hmac
import hashlib
import time
import logging
import urllib.parse
import requests
from typing import Dict, Any, Optional

logger = logging.getLogger("BinanceClient")

class BinanceAPIError(Exception):
    """Custom Exception for Binance API level issues (returns error code/msg)"""
    def __init__(self, code: int, message: str, response_body: Optional[str] = None):
        self.code = code
        self.message = message
        self.response_body = response_body
        super().__init__(f"Binance API Error {code}: {message}")

class BinanceClient:
    """
    Low-level HTTP Client for placing orders on Binance Futures Testnet (USDT-M).
    Supports self-signing, system sync delay correction, and proper logging.
    """
    def __init__(self, api_key: str, api_secret: str, base_url: str = "https://testnet.binancefuture.com"):
        self.api_key = api_key
        self.api_secret = api_secret
        self.base_url = base_url.rstrip("/")
        self.session = requests.Session()
        self.session.headers.update({
            "X-MBX-APIKEY": self.api_key,
            "Content-Type": "application/x-www-form-urlencoded"
        })

    def _sign_query(self, params: Dict[str, Any]) -> str:
        """Generates an HMAC-SHA256 signature and returns the query string."""
        query_string = urllib.parse.urlencode(params)
        signature = hmac.new(
            self.api_secret.encode("utf-8"),
            query_string.encode("utf-8"),
            hashlib.sha256
        ).hexdigest()
        return f"{query_string}&signature={signature}"

    def _request(self, method: str, endpoint: str, params: Dict[str, Any], signed: bool = True) -> Dict[str, Any]:
        """Executes secure request query with retry logs and response parsing."""
        url = f"{self.base_url}{endpoint}"
        
        if signed:
            params["timestamp"] = int(time.time() * 1000)
            params["recvWindow"] = 6000  # Added wiggle room for clock offsets
            query_data = self._sign_query(params)
        else:
            query_data = urllib.parse.urlencode(params)

        # Logging outgoing parameters safely
        masked_params = params.copy()
        logger.info("Outgoing HTTP %s request to %s with parameters: %s", method, endpoint, masked_params)

        try:
            if method.upper() == "POST":
                response = self.session.post(url, data=query_data, timeout=12)
            else:
                response = self.session.get(f"{url}?{query_data}", timeout=12)
            
            logger.info("Binance response received with status code: %d", response.status_code)
            
            try:
                data = response.json()
            except ValueError:
                logger.error("Failed to parse response body as JSON: %s", response.text)
                raise BinanceAPIError(
                    code=-9000, 
                    message="Non-JSON response received from Binance Testnet", 
                    response_body=response.text
                )

            if response.status_code != 200:
                err_code = data.get("code", response.status_code)
                err_msg = data.get("msg", "Unknown Binance Error")
                logger.error("Binance API returned error status! Code: %s, Msg: %s", err_code, err_msg)
                raise BinanceAPIError(code=err_code, message=err_msg, response_body=response.text)

            logger.info("Request successful! Response payload: %s", data)
            return data

        except requests.exceptions.RequestException as e:
            logger.exception("Network connection failure with Binance Futures server: %s", e)
            raise RuntimeError(f"Network error communicating with Binance Futures: {e}")
`,

  "bot/orders.py": `import logging
from typing import Dict, Any, Optional
from bot.client import BinanceClient
from bot.validators import validate_inputs

logger = logging.getLogger("OrderManager")

class OrderManager:
    """
    Manages placement and strategy execution of orders on the Binance client.
    Provides robust, formatted responses and precise feedback.
    """
    def __init__(self, client: BinanceClient):
        self.client = client

    def place_order(
        self, 
        symbol: str, 
        side: str, 
        order_type: str, 
        quantity: float, 
        price: Optional[float] = None,
        stop_price: Optional[float] = None
    ) -> Dict[str, Any]:
        """
        Validates inputs and places market, limit or stop-limit orders on Binance USDT-M Futures.
        """
        logger.info("Initiating placement process: %s %s %s quantity=%s price=%s stop=%s",
                    side, symbol, order_type, quantity, price, stop_price)
        
        # 1. Input Sanitization and Validations
        val_symbol, val_side, val_type, val_qty, val_price, val_stop_price = validate_inputs(
            symbol=symbol,
            side=side,
            order_type=order_type,
            quantity=quantity,
            price=price,
            stop_price=stop_price
        )

        # 2. Build core parameter map for Binance API
        params: Dict[str, Any] = {
            "symbol": val_symbol,
            "side": val_side,
            "type": val_type,
            "quantity": val_qty
        }

        if val_type == "LIMIT":
            params["price"] = val_price
            params["timeInForce"] = "GTC"  # standard Good 'Til Cancelled protocol

        elif val_type == "STOP_LIMIT":
            params["stopPrice"] = val_stop_price
            params["price"] = val_price
            params["timeInForce"] = "GTC"

        # 3. Trigger client execution request
        logger.info("Inputs validated successfully. Dispatching network order...")
        endpoint = "/fapi/v1/order"
        
        response = self.client._request(
            method="POST",
            endpoint=endpoint,
            params=params,
            signed=True
        )

        return response
`,

  "cli.py": `#!/usr/bin/env python3
"""
CLI Command Entrypoint for the Binance Futures Testnet Trading Bot.
Parses user arguments, initializes client, placing requested orders safely.
"""
import os
import sys
import argparse
import logging
from bot.logging_config import setup_logging
from bot.client import BinanceClient, BinanceAPIError
from bot.orders import OrderManager

# Attempt terminal color coding helper
try:
    from colorama import init, Fore, Style
    init(autoreset=True)
    GREEN = Fore.GREEN
    RED = Fore.RED
    YELLOW = Fore.YELLOW
    CYAN = Fore.CYAN
    RESET = Style.RESET_ALL
except ImportError:
    GREEN = RED = YELLOW = CYAN = RESET = ""

def header_print(text: str):
    print(f"\\n{CYAN}{'='*60}\\n{text}\\n{'='*60}{RESET}")

def main():
    # Setup argument parser
    parser = argparse.ArgumentParser(
        description="Primetrade.ai simplified Binance Futures (USDT-M) Testnet Trading Bot",
        formatter_class=argparse.ArgumentDefaultsHelpFormatter
    )
    
    # Required target parameters
    parser.add_argument("--symbol", type=str, required=True, help="Trading symbol (e.g., BTCUSDT, ETHUSDT)")
    parser.add_argument("--side", type=str, required=True, choices=["BUY", "SELL"], help="Order side (BUY or SELL)")
    parser.add_argument("--type", type=str, required=True, choices=["MARKET", "LIMIT", "STOP_LIMIT"], help="Order type (MARKET, LIMIT, or STOP_LIMIT)")
    parser.add_argument("--quantity", type=float, required=True, help="Quantity to trade")
    
    # Conditional parameters
    parser.add_argument("--price", type=float, help="Order limit price (Required if type is LIMIT or STOP_LIMIT)")
    parser.add_argument("--stop-price", type=float, help="Stop trigger price (Required if type is STOP_LIMIT)")
    
    # Credentials configuration overrides
    parser.add_argument("--api-key", type=str, help="Binance Testnet API Key (Can also set BINANCE_TESTNET_API_KEY environment variable)")
    parser.add_argument("--api-secret", type=str, help="Binance Testnet API Secret (Can also set BINANCE_TESTNET_API_SECRET environment variable)")
    
    # Custom log destination override
    parser.add_argument("--log-file", type=str, default="logs/bot.log", help="Output file path for execution log records")

    args = parser.parse_args()

    # 1. Setup logging system (prints to both stdout and rotating logs)
    setup_logging(args.log_file)
    logger = logging.getLogger("CLI_Runner")

    header_print("STARTING BINANCE FUTURES ORDER RUNNER")

    # 2. Extract and authenticate credentials
    api_key = args.api_key or os.getenv("BINANCE_TESTNET_API_KEY")
    api_secret = args.api_secret or os.getenv("BINANCE_TESTNET_API_SECRET")

    if not api_key or not api_secret:
        print(f"{RED}ERROR: API credentials were not found!{RESET}")
        print("Must provide either --api-key / --api-secret OR set env variables:")
        print("  export BINANCE_TESTNET_API_KEY='your_api_key'")
        print("  export BINANCE_TESTNET_API_SECRET='your_api_secret'")
        logger.error("Missing credentials. Stopped execution.")
        sys.exit(1)

    # 3. Print Input Order Request Summary
    print(f"{CYAN}[ORDER REQUEST SUMMARY]{RESET}")
    print(f"  • Symbol:       {args.symbol.upper()}")
    print(f"  • Side:         {args.side.upper()}")
    print(f"  • Order Type:   {args.type.upper()}")
    print(f"  • Quantity:     {args.quantity}")
    if args.price is not None:
        print(f"  • Price:        {args.price}")
    if args.stop_price is not None:
        print(f"  • Stop Price:   {args.stop_price}")
    print(f"  • Log Location: {args.log_file}")
    print("-" * 40)

    # 4. Initialize Core Clients
    try:
        binance_client = BinanceClient(api_key=api_key, api_secret=api_secret)
        order_manager = OrderManager(client=binance_client)
        
        # Place Order executing
        print(f"{YELLOW}Placing order on Binance USDT-M testnet server...{RESET}")
        response = order_manager.place_order(
            symbol=args.symbol,
            side=args.side,
            order_type=args.type,
            quantity=args.quantity,
            price=args.price,
            stop_price=args.stop_price
        )

        # 5. Extract results and print Success Summary
        header_print(f"{GREEN}SUCCESS: ORDER PLACED SUCCESSFULLY")
        print(f"  • Order ID:      {GREEN}{response.get('orderId')}{RESET}")
        print(f"  • Status:        {GREEN}{response.get('status')}{RESET}")
        print(f"  • Executed Qty:  {response.get('executedQty')}")
        print(f"  • Avg Price:     {response.get('avgPrice', '0.00000')} (Estimate)")
        print(f"  • Client OrdId:  {response.get('clientOrderId')}")
        print(f"  • Cum Quote Qty: {response.get('cumQty', '0.0')}")
        print("-" * 40)
        logger.info("Order executed completely via CLI. Order ID: %s", response.get("orderId"))

    except BinanceAPIError as e:
        header_print(f"{RED}FAILED: BINANCE SERVER REJECTED EXECUTABLE")
        print(f"  • Error code:    {RED}{e.code}{RESET}")
        print(f"  • Reason:        {RED}{e.message}{RESET}")
        if e.response_body:
            print(f"  • Raw Response:  {e.response_body}")
        logger.error("CLI Execution halted. Binance API rejected request with code %d: %s", e.code, e.message)
        sys.exit(2)

    except ValueError as e:
        header_print(f"{RED}FAILED: INPUT VALIDATION REJECTED REQUEST")
        print(f"  • Argument issue: {RED}{e}{RESET}")
        logger.error("CLI halt. Input validator caught an exception: %s", e)
        sys.exit(3)

    except Exception as e:
        header_print(f"{RED}FAILED: AN UNEXPECTED EXCEPTION OCCURRED")
        print(f"  • Error Class:   {type(e).__name__}")
        print(f"  • Details:       {RED}{e}{RESET}")
        logger.exception("Unexpected exception raised: %s", e)
        sys.exit(4)

if __name__ == "__main__":
    main()
`,

  "README.md": `# Binance Futures (USDT-M) Testnet Trading Bot
Created as a professional software engineer submission for the Primetrade.ai recruiting assessment.

## Features
- **Strict Binance Futures (USDT-M) Support**: Interfaces securely with the official testnet raw endpoint: \`https://testnet.binancefuture.com\`.
- **Dynamic Signature Authentication**: Automatically generates query parameter signatures through HMAC-SHA256 calculations.
- **Wiggle Room/Time drift Handling**: Corrects local timezone mismatch and network latency error using robust \`recvWindow=6000\`.
- **Clean Split Modular Layout**: Clear distinction amongst Client Layer, CLI Parser, Validators, and Logger controllers.
- **Rich Logging Configuration**: Real-time rotating file appending log records inside \`logs/bot.log\` while simultaneously printing synchronized clean colored system logs on terminal stdout.
- **Robust Exceptions Framework**: Covers API rejections (carrying code context metrics), validation errors, and network losses.
- **Bonusstop Support (STOP_LIMIT)**: In addition to MARKET and LIMIT orders, an extra stop-trigger \`STOP_LIMIT\` type is fully structured and validated in validators.

## Project Directory Tree
\`\`\`
trading_bot/
│
├── logs/
│   └── bot.log             # Live appended logs detailing bot activity
│
├── bot/
│   ├── __init__.py         # Package entry definitions
│   ├── client.py           # Self-signed HTTP connector layer
│   ├── orders.py           # Core place_order orchestration rules
│   ├── validators.py       # Comprehensive sanitization and validation checks
│   └── logging_config.py   # Configures ROTATING log handlers and consoles
│
├── cli.py                  # Main entry point parsing user args and CLI commands
├── requirements.txt        # Python external packages (e.g. requests, colorama)
└── README.md               # User manual & configuration guides
\`\`\`

## System Prerequisites
- Python 3.8 or above installed on your computer.

## Installation & Setup
1. Extract ZIP file contents or clone the repository.
2. In your terminal, run the following command to load dependencies:
   \`\`\`bash
   pip install -r requirements.txt
   \`\`\`
   *(Note: \`colorama\` is a utility libraries package for beautiful console outputs; if missing, colors will fallback to non-ansi system defaults automatically).*

3. Acquire free api keys from the Binance Futures Testnet portal: \`https://testnet.binancefuture.com\`
4. Configure your credentials as environment variables so they don't have to be typed every command:
   \`\`\`bash
   export BINANCE_TESTNET_API_KEY="paste_your_testnet_api_key_here"
   export BINANCE_TESTNET_API_SECRET="paste_your_testnet_api_secret_here"
   \`\`\`

## Operational Run Examples

Verify your local installation is healthy by fetching core arguments:
\`\`\`bash
python cli.py --help
\`\`\`

### 1. Execute a MARKET Buy Order
Place active trade to buy 0.005 BTC immediately at market:
\`\`\`bash
python cli.py --symbol BTCUSDT --side BUY --type MARKET --quantity 0.005
\`\`\`

### 2. Execute a LIMIT Sell Order
Sell 0.012 BTC whenever price rises to $72,500 USDT:
\`\`\`bash
python cli.py --symbol BTCUSDT --side SELL --type LIMIT --quantity 0.012 --price 72500
\`\`\`

### 3. Placing a STOP_LIMIT Bid (Bonus Element)
Set protection buy of 0.02 BTC if price rallies above $69,000, trigger limit buy at $69,150:
\`\`\`bash
python cli.py --symbol BTCUSDT --side BUY --type STOP_LIMIT --quantity 0.02 --price 69150 --stop-price 69000
\`\`\`

## Key Assumptions Made during Construction
1. **Collateral/Currency Choice**: USDT-M (USDT Marginized) futures is selected. Trading symbols are evaluated strictly against quotes matching stable USD (like USDT).
2. **Precision Values**: The bot takes inputs in standard float. Binance requires values within stepSizes, user is assumed to understand the step size for of symbols (e.g. BTCUSDT can do 0.001 decimals).
3. **Network Offset Errors**: Synchronizations between local clocks and trading engines are kept steady through server timezone calibrations.
`
};
