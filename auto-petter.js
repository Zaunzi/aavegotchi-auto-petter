const { ethers } = require('ethers');
require('dotenv').config();

const AAVEGOTCHI_GAME_FACET_ABI = [
  "function interact(uint256[] calldata _tokenIds) external"
];

const AAVEGOTCHI_FACET_ABI = [
  "function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_)"
];

class SimpleAavegotchiAutoPetter {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    this.AAVEGOTCHI_DIAMOND = "0xA99c4B08201F2913Db8D28e71d020c4298F29dBF";
    this.GOTCHI_OWNER = process.env.GOTCHI_OWNER;
    
    this.aavegotchiFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_FACET_ABI, this.provider);
    this.aavegotchiGameFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_GAME_FACET_ABI, this.signer);
    
    // 12 hours 30 seconds in milliseconds
    this.PET_INTERVAL = (12 * 60 * 60 + 30) * 1000;
    
    console.log("Simple Aavegotchi Auto-Petter Bot");
    console.log(`Diamond: ${this.AAVEGOTCHI_DIAMOND}`);
    console.log(`Owner: ${this.GOTCHI_OWNER}`);
    console.log(`Signer: ${this.signer.address}`);
    console.log(`Interval: 12h 30s (${this.PET_INTERVAL}ms)`);
  }

  async petAllGotchis() {
    try {
      console.log(`${new Date().toLocaleString()} - Petting all Aavegotchis...`);
      
      const tokenIds32 = await this.aavegotchiFacet.tokenIdsOfOwner(this.GOTCHI_OWNER);
      const tokenIds = tokenIds32.map(id => BigInt(id));
      
      const gasEstimate = await this.aavegotchiGameFacet.interact.estimateGas(tokenIds);
      const gasLimit = (gasEstimate * 120n) / 100n;
      
      console.log(`Petting ${tokenIds.length} gotchis, gas: ${gasEstimate.toString()}`);
      
      const tx = await this.aavegotchiGameFacet.interact(tokenIds, { gasLimit });
      
      console.log(`TX: ${tx.hash}`);
      console.log(`Basescan: https://basescan.org/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`SUCCESS! Gas used: ${receipt.gasUsed.toString()}`);
      
      const nextPetTime = new Date(Date.now() + this.PET_INTERVAL);
      console.log(`Next pet: ${nextPetTime.toLocaleString()}`);
      
      return true;
      
    } catch (error) {
      console.error(`Pet failed: ${error.message}`);
      return false;
    }
  }

  start() {
    console.log("Starting bot - petting now then every 12h 30s...\n");
    
    // Pet immediately on start
    this.petAllGotchis();
    
    // Then pet every 12 hours 30 seconds
    setInterval(() => {
      this.petAllGotchis();
    }, this.PET_INTERVAL);
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

const bot = new SimpleAavegotchiAutoPetter();
bot.start();