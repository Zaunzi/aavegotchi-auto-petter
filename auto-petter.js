const { ethers } = require('ethers');
require('dotenv').config();

const AAVEGOTCHI_GAME_FACET_ABI = [
  "function interact(uint256[] calldata _tokenIds) external"
];

const AAVEGOTCHI_FACET_ABI = [
  "function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_)",
  "function getAavegotchi(uint256 _tokenId) external view returns (tuple(uint256 tokenId, string name, address owner, uint256 randomNumber, uint256 status, int16[6] numericTraits, int16[6] modifiedNumericTraits, uint16[16] equippedWearables, address collateral, address escrow, uint256 stakedAmount, uint256 minimumStake, uint256 kinship, uint256 lastInteracted, uint256 experience, uint256 toNextLevel, uint256 usedSkillPoints, uint256 level, uint256 hauntId, uint256 baseRarityScore, uint256 modifiedRarityScore, bool locked) aavegotchiInfo)"
];

class AutoPetter {
  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL || 'https://mainnet.base.org');
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    this.AAVEGOTCHI_DIAMOND = "0xA99c4B08201F2913Db8D28e71d020c4298F29dBF";
    this.GOTCHI_OWNER = process.env.GOTCHI_OWNER;
    
    this.aavegotchiFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_FACET_ABI, this.provider);
    this.aavegotchiGameFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_GAME_FACET_ABI, this.signer);
    
    this.PET_INTERVAL = (12 * 60 * 60 + 30) * 1000; // 12h 30s in milliseconds
    this.regularInterval = null;
    this.hasStartedRegularSchedule = false;
    
    console.log("Hybrid Aavegotchi Auto-Petter Bot");
    console.log(`Diamond: ${this.AAVEGOTCHI_DIAMOND}`);
    console.log(`Owner: ${this.GOTCHI_OWNER}`);
    console.log(`Signer: ${this.signer.address}`);
    console.log(`Regular interval: 12h 30s`);
  }

  async findWhenReady() {
    try {
      console.log("Checking when gotchis will be ready...");
      
      const tokenIds32 = await this.aavegotchiFacet.tokenIdsOfOwner(this.GOTCHI_OWNER);
      if (tokenIds32.length === 0) {
        console.log("No Aavegotchis found");
        return null;
      }

      console.log(`Found ${tokenIds32.length} Aavegotchis, checking first 8...`);
      
      let oldestLastInteracted = Number.MAX_SAFE_INTEGER;
      let checkedCount = 0;
      
      // Check first 8 gotchis to get a representative sample
      for (let i = 0; i < Math.min(tokenIds32.length, 8); i++) {
        try {
          const tokenId = tokenIds32[i];
          const aavegotchiInfo = await this.aavegotchiFacet.getAavegotchi(tokenId);
          const lastInteracted = Number(aavegotchiInfo.lastInteracted);
          
          if (lastInteracted < oldestLastInteracted) {
            oldestLastInteracted = lastInteracted;
          }
          
          checkedCount++;
          await new Promise(resolve => setTimeout(resolve, 100)); // Rate limit
          
        } catch (error) {
          continue; // Skip erroring tokens
        }
      }
      
      if (oldestLastInteracted === Number.MAX_SAFE_INTEGER) {
        console.log("Could not determine interaction times");
        return 0; // Try immediately
      }
      
      // When will they be ready (12 hours + 30 seconds)
      const nextReadyTime = oldestLastInteracted + (12 * 60 * 60) + 30;
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log(`Checked ${checkedCount} gotchis`);
      console.log(`Oldest interaction: ${new Date(oldestLastInteracted * 1000)}`);
      console.log(`Next ready time: ${new Date(nextReadyTime * 1000)}`);
      console.log(`Current time: ${new Date(currentTime * 1000)}`);
      
      if (nextReadyTime <= currentTime) {
        console.log("Ready now!");
        return 0;
      } else {
        const waitTime = nextReadyTime - currentTime;
        const hours = Math.floor(waitTime / 3600);
        const minutes = Math.floor((waitTime % 3600) / 60);
        console.log(`Need to wait ${hours}h ${minutes}m`);
        return waitTime * 1000; // Convert to milliseconds
      }
      
    } catch (error) {
      console.error("Error checking ready time:", error.message);
      return 0; // Try immediately if check fails
    }
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
      
      return true;
      
    } catch (error) {
      console.error(`Pet failed: ${error.message}`);
      return false;
    }
  }

  startRegularSchedule() {
    if (this.hasStartedRegularSchedule) return;
    
    console.log("Starting regular 12h 30s schedule...");
    this.hasStartedRegularSchedule = true;
    
    this.regularInterval = setInterval(() => {
      console.log("Regular scheduled pet time!");
      this.petAllGotchis();
    }, this.PET_INTERVAL);
    
    const nextPetTime = new Date(Date.now() + this.PET_INTERVAL);
    console.log(`Next regular pet: ${nextPetTime.toLocaleString()}`);
  }

  async start() {
    console.log("Starting bot...\n");
    
    const waitTimeMs = await this.findWhenReady();
    
    if (waitTimeMs === 0) {
      // Pet now and start regular schedule
      console.log("Petting immediately...");
      const success = await this.petAllGotchis();
      
      if (success) {
        this.startRegularSchedule();
      } else {
        console.log("Initial pet failed, retrying in 10 minutes");
        setTimeout(() => this.start(), 10 * 60 * 1000);
      }
    } else {
      // Wait for the calculated time, then pet and start regular schedule
      console.log(`Waiting ${Math.floor(waitTimeMs / 1000 / 60)} minutes for first pet...`);
      
      setTimeout(async () => {
        console.log("Time for first pet!");
        const success = await this.petAllGotchis();
        
        if (success) {
          this.startRegularSchedule();
        } else {
          console.log("First pet failed, retrying in 10 minutes");
          setTimeout(() => this.start(), 10 * 60 * 1000);
        }
      }, waitTimeMs);
    }
  }

  stop() {
    if (this.regularInterval) {
      clearInterval(this.regularInterval);
    }
    console.log("Bot stopped");
  }
}

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down...');
  process.exit(0);
});

const bot = new AutoPetter();
bot.start();