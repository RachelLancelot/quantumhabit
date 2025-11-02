# QuantumHabit

A privacy-preserving habit tracking decentralized application (dApp) built with FHEVM (Fully Homomorphic Encryption Virtual Machine). QuantumHabit enables users to track their habits and progress while keeping all data encrypted on-chain.

## 🌟 Features

- **Privacy-Preserving**: All habit data and progress are encrypted using FHEVM, ensuring complete privacy
- **Encrypted Habit Tracking**: Create and manage habits with encrypted completion status
- **Progress Statistics**: View encrypted statistics including completion rate, consecutive days, and progress percentage
- **Reward System**: Earn rewards for reaching milestones (25%, 50%, 75%, 100%) and maintaining streaks (7, 14, 30, 60 days)
- **Web3 Integration**: Connect with MetaMask and interact with the blockchain
- **Modern UI**: Beautiful, responsive interface built with Next.js and Tailwind CSS

## 🏗️ Project Structure

```
quantumhabit/
├── fhevm-hardhat-template/    # Smart contracts and Hardhat configuration
│   ├── contracts/             # Solidity smart contracts
│   │   └── QuantumHabit.sol   # Main habit tracking contract
│   ├── deploy/                # Deployment scripts
│   ├── test/                  # Contract tests
│   └── tasks/                 # Hardhat custom tasks
└── quantumhabit-frontend/     # Next.js frontend application
    ├── app/                   # Next.js app router pages
    ├── components/            # React components
    ├── hooks/                # Custom React hooks
    ├── fhevm/                 # FHEVM integration utilities
    └── abi/                   # Contract ABIs and addresses
```

## 🚀 Quick Start

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm** or **yarn**: Package manager
- **MetaMask**: Browser extension wallet
- **Hardhat Node** (for local development): Run `npx hardhat node` in the `fhevm-hardhat-template` directory

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd quantumhabit
   ```

2. **Install contract dependencies**

   ```bash
   cd fhevm-hardhat-template
   npm install
   ```

3. **Install frontend dependencies**

   ```bash
   cd ../quantumhabit-frontend
   npm install
   ```

4. **Set up environment variables** (for contract deployment)

   ```bash
   cd ../fhevm-hardhat-template
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   ```

### Development

#### Local Development (with Mock FHEVM)

1. **Start Hardhat node** (in `fhevm-hardhat-template`)

   ```bash
   npx hardhat node
   ```

2. **Deploy contracts** (in another terminal)

   ```bash
   cd fhevm-hardhat-template
   npx hardhat deploy --network localhost
   ```

3. **Start frontend with mock mode** (in `quantumhabit-frontend`)

   ```bash
   cd quantumhabit-frontend
   npm run dev:mock
   ```

#### Production Development (with Real Relayer)

1. **Start frontend** (in `quantumhabit-frontend`)

   ```bash
   npm run dev
   ```

2. **Connect MetaMask** to Sepolia testnet (Chain ID: 11155111)

3. **Interact with the dApp** at `http://localhost:3000`

### Testing

#### Contract Tests

```bash
cd fhevm-hardhat-template
npm run test
```

#### Frontend Static Export Check

```bash
cd quantumhabit-frontend
npm run check:static
```

#### Build Frontend

```bash
cd quantumhabit-frontend
npm run build
```

## 📦 Deployment

### Deploy Contracts to Sepolia

```bash
cd fhevm-hardhat-template
npx hardhat deploy --network sepolia
```

### Deploy Frontend to Vercel

The frontend is configured for static export and can be deployed to Vercel or any static hosting service.

```bash
cd quantumhabit-frontend
npx vercel --prod
```

## 🔐 FHEVM Integration

This project uses FHEVM v0.9 and Relayer SDK 0.3.0 for encrypted computations:

- **Encrypted Types**: `euint8`, `euint32`, `ebool`
- **Operations**: `FHE.add`, `FHE.sub`, `FHE.mul`, `FHE.div`, `FHE.lt`, `FHE.gt`, `FHE.eq`
- **Authorization**: `FHE.allow`, `FHE.allowThis` for decryption authorization
- **External Input**: `FHE.fromExternal` for converting external encrypted data

## 📱 Usage

1. **Connect Wallet**: Click "Connect Wallet" and approve MetaMask connection
2. **Create Habit**: Navigate to "Create Habit" and fill in habit details
3. **Record Progress**: Mark habits as completed daily
4. **View Statistics**: Check your progress and completion rates
5. **Claim Rewards**: Earn and claim rewards for milestones and streaks

## 🛠️ Technologies

- **Smart Contracts**: Solidity ^0.8.24
- **FHEVM**: @fhevm/solidity ^0.9.1
- **Hardhat**: Development environment and testing framework
- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS
- **Web3**: ethers.js v6
- **Wallet**: MetaMask (EIP-1193)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License.

## 🔗 Links

- **Live Demo**: [Vercel Deployment](https://qhb0xmr36oz.vercel.app)
- **Sepolia Contract**: `0xD70f68c12859662c5fafF9Dd79a04110d18BdF97`
- **Etherscan**: [View on Sepolia Etherscan](https://sepolia.etherscan.io/address/0xD70f68c12859662c5fafF9Dd79a04110d18BdF97)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 Notes

- This project uses FHEVM for privacy-preserving computations
- All habit data is encrypted on-chain
- The frontend supports both mock mode (for local development) and real relayer mode (for production)
- Static export is required for deployment compatibility

---

**Built with privacy in mind using FHEVM technology**

