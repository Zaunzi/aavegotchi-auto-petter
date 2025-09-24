const { ethers } = require('ethers');
require('dotenv').config();

const AAVEGOTCHI_GAME_FACET_ABI = [
  "function interact(uint256[] calldata _tokenIds) external"
];

const AAVEGOTCHI_FACET_ABI = [
  "function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_)",
  "function getAavegotchi(uint256 _tokenId) external view returns (tuple(uint256 tokenId, string name, address owner, uint256 randomNumber, uint256 status, int16[6] numericTraits, int16[6] modifiedNumericTraits, uint16[16] equippedWearables, address collateral, address escrow, uint256 stakedAmount, uint256 minimumStake, uint256 kinship, uint256 lastInteracted, uint256 experience, uint256 toNextLevel, uint256 usedSkillPoints, uint256 level, uint256 hauntId, uint256 baseRarityScore, uint256 modifiedRarityScore, bool locked) aavegotchiInfo)"
];

class AavegotchiAutoPetter {
  constructor() {
    this.provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
    this.signer = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
    
    this.AAVEGOTCHI_DIAMOND = "0xA99c4B08201F2913Db8D28e71d020c4298F29dBF";
    this.GOTCHI_OWNER = process.env.GOTCHI_OWNER;
    
    this.aavegotchiFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_FACET_ABI, this.provider);
    this.aavegotchiGameFacet = new ethers.Contract(this.AAVEGOTCHI_DIAMOND, AAVEGOTCHI_GAME_FACET_ABI, this.signer);
    
    this.PET_INTERVAL = (12 * 60 * 60 + 30) * 1000; // 12h 30s
    
    console.log("Aavegotchi Auto-Petter Bot");
    console.log(`Diamond: ${this.AAVEGOTCHI_DIAMOND}`);
    console.log(`Owner: ${this.GOTCHI_OWNER}`);
    console.log(`Signer: ${this.signer.address}`);
  }

  async findWhenReady() {
    try {
      console.log("Checking when gotchis will be ready...");
      
      const tokenIds32 = await this.aavegotchiFacet.tokenIdsOfOwner(this.GOTCHI_OWNER);
      console.log(`Found ${tokenIds32.length} Aavegotchis, checking first 3...`);
      
      let oldestLastInteracted = Number.MAX_SAFE_INTEGER;
      let checkedCount = 0;
      
      // Check first 3 gotchis only
      for (let i = 0; i < Math.min(tokenIds32.length, 3); i++) {
        try {
          const tokenId = tokenIds32[i];
          const aavegotchiInfo = await this.aavegotchiFacet.getAavegotchi(tokenId);
          const lastInteracted = Number(aavegotchiInfo.lastInteracted);
          
          if (lastInteracted < oldestLastInteracted) {
            oldestLastInteracted = lastInteracted;
          }
          
          checkedCount++;
          await new Promise(resolve => setTimeout(resolve, 200));
          
        } catch (error) {
          console.log(`Skipping token ${i}, continuing...`);
          continue;
        }
      }
      
      if (oldestLastInteracted === Number.MAX_SAFE_INTEGER) {
        console.log("Could not determine timing, will pet now");
        return 0;
      }
      
      const nextReadyTime = oldestLastInteracted + (12 * 60 * 60) + 30;
      const currentTime = Math.floor(Date.now() / 1000);
      
      console.log(`Checked ${checkedCount} gotchis`);
      console.log(`Oldest interaction: ${new Date(oldestLastInteracted * 1000)}`);
      console.log(`Next ready time: ${new Date(nextReadyTime * 1000)}`);
      
      if (nextReadyTime <= currentTime) {
        console.log("Ready now!");
        return 0;
      } else {
        const waitTime = nextReadyTime - currentTime;
        const hours = Math.floor(waitTime / 3600);
        const minutes = Math.floor((waitTime % 3600) / 60);
        console.log(`Need to wait ${hours}h ${minutes}m`);
        return waitTime * 1000;
      }
      
    } catch (error) {
      console.error("Error checking timing:", error.message);
      return 0; // Pet immediately if check fails
    }
  }

  async petAllGotchis() {
    try {
      console.log(`${new Date().toLocaleString()} - Petting all Aavegotchis...`);
      
      const tokenIds32 = await this.aavegotchiFacet.tokenIdsOfOwner(this.GOTCHI_OWNER);
      console.log(`Found ${tokenIds32.length} Aavegotchis to pet`);
      
      if (tokenIds32.length === 0) {
        console.log("No Aavegotchis found!");
        return false;
      }
      
      const tokenIds = tokenIds32.map(id => BigInt(id));
      
      console.log("Calling interact...");
      const tx = await this.aavegotchiGameFacet.interact(tokenIds);
      
      console.log(`Transaction sent: ${tx.hash}`);
      console.log(`View on Basescan: https://basescan.org/tx/${tx.hash}`);
      
      const receipt = await tx.wait();
      console.log(`Petting successful! Block: ${receipt.blockNumber}`);
      
      return true;
      
    } catch (error) {
      console.error("Petting failed:", error.message);
      return false;
    }
  }

  async start() {
    console.log("Starting bot...\n");
    
    const waitTimeMs = await this.findWhenReady();
    
    if (waitTimeMs === 0) {
      console.log("Petting immediately...");
      await this.petAllGotchis();
    } else {
      console.log(`Waiting ${Math.floor(waitTimeMs/1000/60)} minutes for first pet...`);
      
      setTimeout(async () => {
        console.log("Time for first pet!");
        await this.petAllGotchis();
      }, waitTimeMs);
    }
    
    // Start regular interval after the wait time (or immediately if waitTimeMs is 0)
    setTimeout(() => {
      setInterval(() => {
        this.petAllGotchis();
      }, this.PET_INTERVAL);
    }, waitTimeMs + 1000); // Add 1 second buffer after first pet
  }
}

const bot = new AavegotchiAutoPetter();
bot.start();