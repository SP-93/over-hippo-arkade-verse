# Over Protocol Mainnet Setup Guide

## 🚀 Quick Start

### Step 1: Smart Contract Deployment

1. **Install Hardhat dependencies:**
```bash
npm install --save-dev @nomicfoundation/hardhat-toolbox hardhat
npm install @openzeppelin/contracts
```

2. **Get OVER token contract address:**
   - Visit https://scan.over.network
   - Search for OVER token contract
   - Copy the contract address

3. **Deploy ArcadeGameContract:**
```bash
# Add your private key to hardhat.config.js
# Update OVER_TOKEN_ADDRESS in scripts/deploy.js
npx hardhat run scripts/deploy.js --network overprotocol
```

4. **Update configuration:**
   - Copy the deployed contract address
   - Update `ARCADE_CONTRACT` in `src/types/over-protocol.ts`
   - Update `OVER_TOKEN` address

### Step 2: MetaMask Setup

Add Over Protocol Mainnet to MetaMask:

- **Network Name:** Over Protocol Mainnet
- **RPC URL:** https://rpc.overprotocol.com
- **Chain ID:** 54176
- **Currency Symbol:** OVER
- **Block Explorer:** https://scan.over.network

### Step 3: Frontend Testing

1. **Connect wallet to Over Protocol**
2. **Get some OVER tokens** (from DEX or faucet)
3. **Test chip purchase flow**
4. **Test game functionality**

## 📋 Current Status

✅ **Completed:**
- Supabase backend with RLS policies
- Over Protocol network configuration
- Smart contract code ready
- Frontend wallet integration
- All 3 games with enhanced graphics

🔧 **In Progress:**
- Smart contract deployment
- Real wallet connection testing

⏳ **Next Steps:**
- Deploy to Over Protocol mainnet
- Update contract addresses
- Full end-to-end testing

## 🔗 Important Links

- **Over Protocol Explorer:** https://scan.over.network
- **RPC Endpoint:** https://rpc.overprotocol.com
- **Chain ID:** 54176
- **UCID:** 29407

## 🛠️ Development Commands

```bash
# Compile contracts
npx hardhat compile

# Deploy to Over Protocol
npx hardhat run scripts/deploy.js --network overprotocol

# Verify contract
npx hardhat verify --network overprotocol <CONTRACT_ADDRESS> <OVER_TOKEN_ADDRESS>

# Start frontend
npm run dev
```

## 🎯 Ready for Mainnet Testing!

The project is now configured for Over Protocol mainnet. Deploy the smart contract and you'll be ready to test with real OVER tokens.