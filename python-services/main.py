"""
Over Protocol Python Service Layer
Complementary service for advanced blockchain operations
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from web3 import Web3
import os
from dotenv import load_dotenv
import logging

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Over Protocol Python Service", version="1.0.0")

# Over Protocol configuration
OVER_PROTOCOL_RPC = "https://rpc.overprotocol.com"
CHAIN_ID = 54176

# Initialize Web3 connection
try:
    w3 = Web3(Web3.HTTPProvider(OVER_PROTOCOL_RPC))
    logger.info(f"Connected to Over Protocol: {w3.is_connected()}")
except Exception as e:
    logger.error(f"Failed to connect to Over Protocol: {e}")
    w3 = None

class BalanceRequest(BaseModel):
    address: str

class TransactionRequest(BaseModel):
    from_address: str
    to_address: str
    amount: str

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "over_protocol_connected": w3.is_connected() if w3 else False,
        "chain_id": CHAIN_ID
    }

@app.get("/network/info")
async def get_network_info():
    """Get Over Protocol network information"""
    if not w3 or not w3.is_connected():
        raise HTTPException(status_code=503, detail="Not connected to Over Protocol")
    
    try:
        latest_block = w3.eth.block_number
        gas_price = w3.eth.gas_price
        
        return {
            "chain_id": CHAIN_ID,
            "latest_block": latest_block,
            "gas_price_gwei": w3.from_wei(gas_price, 'gwei'),
            "rpc_url": OVER_PROTOCOL_RPC
        }
    except Exception as e:
        logger.error(f"Error getting network info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/balance/check")
async def check_balance(request: BalanceRequest):
    """Check OVER balance for an address"""
    if not w3 or not w3.is_connected():
        raise HTTPException(status_code=503, detail="Not connected to Over Protocol")
    
    try:
        if not w3.is_address(request.address):
            raise HTTPException(status_code=400, detail="Invalid address format")
        
        balance_wei = w3.eth.get_balance(request.address)
        balance_over = w3.from_wei(balance_wei, 'ether')
        
        return {
            "address": request.address,
            "balance_over": str(balance_over),
            "balance_wei": str(balance_wei),
            "timestamp": w3.eth.get_block('latest')['timestamp']
        }
    except Exception as e:
        logger.error(f"Error checking balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/transaction/estimate-gas")
async def estimate_gas(request: TransactionRequest):
    """Estimate gas for a transaction"""
    if not w3 or not w3.is_connected():
        raise HTTPException(status_code=503, detail="Not connected to Over Protocol")
    
    try:
        if not w3.is_address(request.from_address) or not w3.is_address(request.to_address):
            raise HTTPException(status_code=400, detail="Invalid address format")
        
        amount_wei = w3.to_wei(request.amount, 'ether')
        
        # Estimate gas
        gas_estimate = w3.eth.estimate_gas({
            'from': request.from_address,
            'to': request.to_address,
            'value': amount_wei
        })
        
        gas_price = w3.eth.gas_price
        total_cost_wei = gas_estimate * gas_price + amount_wei
        
        return {
            "gas_estimate": gas_estimate,
            "gas_price_gwei": w3.from_wei(gas_price, 'gwei'),
            "total_cost_over": w3.from_wei(total_cost_wei, 'ether'),
            "transaction_cost_over": w3.from_wei(gas_estimate * gas_price, 'ether')
        }
    except Exception as e:
        logger.error(f"Error estimating gas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/analytics/network-stats")
async def get_network_analytics():
    """Get network analytics and statistics"""
    if not w3 or not w3.is_connected():
        raise HTTPException(status_code=503, detail="Not connected to Over Protocol")
    
    try:
        latest_block = w3.eth.get_block('latest')
        
        # Calculate some basic network stats
        block_time = 0
        if latest_block['number'] > 0:
            prev_block = w3.eth.get_block(latest_block['number'] - 1)
            block_time = latest_block['timestamp'] - prev_block['timestamp']
        
        return {
            "latest_block_number": latest_block['number'],
            "latest_block_timestamp": latest_block['timestamp'],
            "latest_block_transactions": len(latest_block['transactions']),
            "average_block_time_seconds": block_time,
            "gas_limit": latest_block['gasLimit'],
            "gas_used": latest_block['gasUsed'],
            "gas_utilization_percent": (latest_block['gasUsed'] / latest_block['gasLimit']) * 100
        }
    except Exception as e:
        logger.error(f"Error getting analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)