# Aavegotchi Auto-Petter Bot

An automated bot that pets your Aavegotchi NFTs on the Base network every 12 hours to maintain their kinship levels.

## Features

- 🤖 **Automated Petting**: Pets all your Aavegotchis every 12 hours and 30 seconds
- ⏰ **Smart Timing**: Checks when your oldest Aavegotchi was last petted to optimize timing
- 🔗 **Base Network**: Operates on Base mainnet for low gas fees
- 📦 **Batch Processing**: Pets all Aavegotchis in a single transaction to save gas
- 🛡️ **Error Handling**: Robust error handling and retry logic

## Prerequisites

- Node.js (v16 or higher)
- A VPS or server to run the bot 24/7
- A wallet with some ETH on Base network for gas fees
- Aavegotchi NFTs on Base network

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/Zaunzi/aavegotchi-auto-petter
   cd aavegotchi-auto-petter
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   ```bash
   cp env.example .env
   nano .env  # or use your preferred editor
   ```

4. **Fill in your configuration in `.env`:**
   - `PRIVATE_KEY`: Your wallet's private key (without 0x prefix)
   - `GOTCHI_OWNER`: Ethereum address that owns the Aavegotchis

## Enable Pet Operator Permission

**IMPORTANT:** Before running the bot, you must enable Pet Operator permissions for your petting wallet using the Aavegotchi smart contract.

The Aavegotchi smart contracts use the diamond standard (EIP-2535) design pattern. You can use [louper.dev](https://louper.dev) to interact with the various Aavegotchi facets directly in your browser.

### Steps to Enable Pet Operator:

1. **Visit the Aavegotchi Diamond on Louper.dev**
   - Go to: https://louper.dev/diamond/0xA99c4B08201F2913Db8D28e71d020c4298F29dBF?network=base

2. **Connect Your Wallet**
   - Connect the wallet that **owns** your Aavegotchis (not necessarily the petting wallet)

3. **Navigate to AavegotchiFacet**
   - Find and select the "AavegotchiFacet" from the list of facets

4. **Use setPetOperatorForAll Method**
   - Find the `setPetOperatorForAll` method
   - In the `_operator` field, enter the wallet address that will do the petting (your bot's wallet)
   - Check the `_approved` field to `true`
   - Click "Execute" and confirm the transaction

5. **Verify Success**
   - Wait for the transaction to confirm
   - Your petting wallet is now authorized to pet your Aavegotchis

### To Revoke Permissions (Optional):
If you ever want to revoke petting permissions:
- Use the same `setPetOperatorForAll` method
- Enter the same operator address
- Set `_approved` to `false`
- Execute the transaction

**Note:** Make sure your petting wallet has sufficient ETH balance on Base network to fund the petting transactions (approximately 0.0001-0.0005 ETH per petting session).

## Configuration

### Required Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `PRIVATE_KEY` | Your wallet's private key (without 0x) | `abcd1234...` |
| `GOTCHI_OWNER` | Address owning the Aavegotchis | `0x1234...` |

### Optional Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `RPC_URL` | Custom RPC endpoint | Base mainnet |
| `MAX_FEE_PER_GAS` | Maximum gas fee per gas unit | Auto |
| `MAX_PRIORITY_FEE_PER_GAS` | Maximum priority fee | Auto |

## Running the Bot

### Method 1: Direct Node.js

```bash
# Test run
node auto-petter.js

# Run in background
nohup node auto-petter.js > petter.log 2>&1 &
```

### Method 2: Using PM2 (Recommended for VPS)

PM2 is a production process manager for Node.js applications that keeps your bot running 24/7.

1. **Install PM2 globally**
   ```bash
   npm install -g pm2
   ```

2. **Start the bot with PM2**
   ```bash
   pm2 start auto-petter.js --name "aavegotchi-petter"
   ```

3. **Useful PM2 commands**
   ```bash
   # View running processes
   pm2 list
   
   # View logs
   pm2 logs aavegotchi-petter
   
   # Restart the bot
   pm2 restart aavegotchi-petter
   
   # Stop the bot
   pm2 stop aavegotchi-petter
   
   # Delete the bot process
   pm2 delete aavegotchi-petter
   
   # Save PM2 configuration
   pm2 save
   
   # Setup PM2 to start on system boot
   pm2 startup
   ```

4. **Monitor the bot**
   ```bash
   # Real-time monitoring
   pm2 monit
   
   # View detailed logs
   pm2 logs aavegotchi-petter --lines 100
   ```

## Additional Scripts

The project includes additional utility scripts:

- **`manual-pet.js`**: Manually pet your Aavegotchis once
  ```bash
  node manual-pet.js
  ```

- **`check-actual-pet-time.js`**: Check when your Aavegotchis were last petted
  ```bash
  node check-actual-pet-time.js
  ```

## How It Works

1. **Initialization**: The bot connects to Base network and loads your wallet
2. **Discovery**: Finds all Aavegotchis owned by the specified address
3. **Timing Check**: Examines the first 3 Aavegotchis to determine optimal petting time
4. **Scheduling**: Sets up automated petting every 12 hours and 30 seconds
5. **Execution**: Calls the `interact()` function on the Aavegotchi contract to pet all your gotchis

## Gas Costs

- Each petting transaction costs approximately 0.0001-0.0005 ETH on Base
- The bot pets all your Aavegotchis in a single transaction to minimize gas costs
- Ensure your wallet has sufficient ETH balance for continuous operation

## Security Notes

- **Never share your private key**: Keep your `.env` file secure and never commit it to version control
- **Use a dedicated wallet**: Consider using a separate wallet just for the bot with minimal ETH
- **Monitor regularly**: Check logs periodically to ensure the bot is working correctly

## Troubleshooting

### Common Issues

1. **"insufficient funds for gas"**
   - Add more ETH to your wallet on Base network

2. **"execution reverted"**
   - Your Aavegotchis might not be ready for petting yet
   - Check the last interaction time with `check-actual-pet-time.js`

3. **"nonce too low/high"**
   - Restart the bot: `pm2 restart aavegotchi-petter`

4. **Bot stops running**
   - Check PM2 status: `pm2 list`
   - View logs: `pm2 logs aavegotchi-petter`
   - Restart if needed: `pm2 restart aavegotchi-petter`

### Logs Location

- **PM2 logs**: `~/.pm2/logs/`
- **Custom logs**: Check the bot output for transaction hashes and Basescan links

## Support

If you encounter issues:

1. Check the logs for error messages
2. Verify your `.env` configuration
3. Ensure your wallet has sufficient ETH balance
4. Check that your Aavegotchis are on Base network

## License

This project is for educational purposes. Use at your own risk 

---

**Happy Petting! 👻**
