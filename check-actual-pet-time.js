const { ethers } = require('ethers');
require('dotenv').config();

const AAVEGOTCHI_GAME_FACET_ABI = [
  "function getAavegotchi(uint256 _tokenId) external view returns (tuple(uint256 tokenId, string name, address owner, uint256 randomNumber, uint256 status, int16[6] numericTraits, int16[6] modifiedNumericTraits, uint16[16] equippedWearables, address collateral, address escrow, uint256 stakedAmount, uint256 minimumStake, uint256 kinship, uint256 lastInteracted, uint256 experience, uint256 toNextLevel, uint256 usedSkillPoints, uint256 level, uint256 hauntId, uint256 baseRarityScore, uint256 modifiedRarityScore, bool locked) aavegotchiInfo)"
];

const AAVEGOTCHI_FACET_ABI = [
  "function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  
  const AAVEGOTCHI_DIAMOND = "0xA99c4B08201F2913Db8D28e71d020c4298F29dBF";
  const GOTCHI_OWNER = "0xCE3214768474F006C50189D2d9583f19e3791f96";
  
  console.log("🔍 Checking actual Aavegotchi last interaction times...");
  console.log(`Diamond: ${AAVEGOTCHI_DIAMOND}`);
  console.log(`Owner: ${GOTCHI_OWNER}`);
  
  try {
    // Get owner's Aavegotchis
    const aavegotchiFacet = new ethers.Contract(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_FACET_ABI, provider);
    const tokenIds = await aavegotchiFacet.tokenIdsOfOwner(GOTCHI_OWNER);
    
    console.log(`\n📊 Found ${tokenIds.length} Aavegotchis:`);
    
    if (tokenIds.length === 0) {
      console.log("❌ No Aavegotchis found for this owner on Base!");
      return;
    }
    
    // Check each Aavegotchi's last interaction
    const aavegotchiGameFacet = new ethers.Contract(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_GAME_FACET_ABI, provider);
    
    let oldestLastInteracted = Number.MAX_SAFE_INTEGER;
    const currentTime = Math.floor(Date.now() / 1000);
    
    for (let i = 0; i < tokenIds.length; i++) {
      const tokenId = tokenIds[i];
      console.log(`\n🎮 Checking Aavegotchi #${tokenId}:`);
      
      try {
        const aavegotchiInfo = await aavegotchiGameFacet.getAavegotchi(tokenId);
        const lastInteracted = Number(aavegotchiInfo.lastInteracted);
        
        console.log(`  Name: ${aavegotchiInfo.name}`);
        console.log(`  Last Interacted: ${lastInteracted} (${new Date(lastInteracted * 1000)})`);
        console.log(`  Hours since pet: ${((currentTime - lastInteracted) / 3600).toFixed(2)}`);
        
        if (lastInteracted < oldestLastInteracted) {
          oldestLastInteracted = lastInteracted;
        }
        
      } catch (error) {
        console.log(`  ❌ Error getting info for token ${tokenId}: ${error.message}`);
      }
    }
    
    console.log(`\n🕐 Summary:`);
    console.log(`Current time: ${currentTime} (${new Date(currentTime * 1000)})`);
    console.log(`Oldest last interaction: ${oldestLastInteracted} (${new Date(oldestLastInteracted * 1000)})`);
    
    const hoursSinceOldest = (currentTime - oldestLastInteracted) / 3600;
    console.log(`Hours since oldest pet: ${hoursSinceOldest.toFixed(2)}`);
    
    if (hoursSinceOldest >= 12) {
      console.log("✅ Should be ready to pet!");
    } else {
      console.log("⏳ Not ready yet, need to wait more.");
    }
    
  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

main().catch(console.error);