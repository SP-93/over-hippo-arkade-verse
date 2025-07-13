# Over Protocol Python Services

This Python service layer provides complementary functionality to the main JavaScript/TypeScript application for advanced Over Protocol blockchain operations.

## Why Python Services?

While Over Protocol is fully EVM-compatible and works perfectly with JavaScript/TypeScript tooling, this Python layer provides:

1. **Advanced Analytics**: Data processing with NumPy/Pandas
2. **Machine Learning**: Potential for game analytics and user behavior analysis
3. **Heavy Computation**: Complex calculations that might be better suited for Python
4. **Integration**: Bridge to Python-specific blockchain libraries if needed

## Current Architecture

```
Frontend (React/TypeScript)
    ↓
Backend (Supabase + JavaScript)
    ↓
Blockchain (Over Protocol - EVM Compatible)
    ↓
Optional: Python Services (Analytics, ML, Heavy Computation)
```

## Setup

1. **Install Dependencies**:
```bash
cd python-services
pip install -r requirements.txt
```

2. **Environment Configuration**:
```bash
cp .env.example .env
# Edit .env with your configuration
```

3. **Run the Service**:
```bash
python main.py
# Or with uvicorn directly:
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Network Information
- `GET /network/info` - Over Protocol network stats
- `GET /analytics/network-stats` - Detailed network analytics

### Blockchain Operations
- `POST /balance/check` - Check OVER token balance
- `POST /transaction/estimate-gas` - Estimate transaction gas costs

## Integration with Main App

The Python service runs independently and can be called from your main JavaScript application:

```javascript
// Example: Call Python service from JavaScript
const response = await fetch('http://localhost:8000/balance/check', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ address: walletAddress })
});
const balanceData = await response.json();
```

## When to Use

- ✅ **Complex analytics and data processing**
- ✅ **Machine learning features**
- ✅ **Heavy computational tasks**
- ❌ **Basic blockchain interactions** (use existing JS stack)
- ❌ **Simple CRUD operations** (use Supabase)

## Note

Over Protocol is EVM-compatible and works perfectly with your existing JavaScript/TypeScript/Solidity stack. This Python layer is optional and only needed for specific advanced features that benefit from Python's ecosystem.

Your current setup with Hardhat, ethers.js, and Solidity is the standard and recommended approach for Over Protocol development.