# README.md

# GNF Token Presale Platform

This project is a decentralized application (dApp) for conducting a GNF token presale. It allows users to connect their wallets, buy tokens using USDT or BUSD, and track their referrals.

## Features

- **Connect Wallet**: Users can connect their Ethereum wallet using the Rainbow package.
- **Buy Tokens**: Users can purchase GNF tokens by entering the desired amount of USDT or BUSD.
- **Referral Dashboard**: Users can view their referral URL and track referrals using MongoDB.
- **Transaction Verification**: The application verifies transactions on the Ethereum blockchain.

## Project Structure

```
presale-dapp
├── src
│   ├── components
│   │   ├── Header.tsx
│   │   ├── ConnectWallet.tsx
│   │   ├── BuyTokens.tsx
│   │   └── ReferralDashboard.tsx
│   ├── pages
│   │   ├── Home.tsx
│   │   └── Dashboard.tsx
│   ├── utils
│   │   ├── web3.ts
│   │   └── api.ts
│   ├── models
│   │   └── Referral.ts
│   └── config
│       └── constants.ts
├── public
│   └── logo.svg
├── .env
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   cd presale-dapp
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in the root directory and add the necessary environment variables, including contract addresses and API base URL.

4. Start the development server:
   ```
   npm start
   ```

## Usage

- Navigate to the home page to connect your wallet and buy tokens.
- Access the dashboard to view your referral statistics and token purchases.

## License

This project is licensed under the MIT License.