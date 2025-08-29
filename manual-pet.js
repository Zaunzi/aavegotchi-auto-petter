const { ethers } = require('ethers');
require('dotenv').config();

const LAZY_PETTER_ABI = [
  "function petGotchis() external",
  "function lastExecuted() external view returns (uint256)"
];

// We need to call the diamond directly to bypass our time check
const AAVEGOTCHI_GAME_FACET_ABI = [
  "function interact(uint256[] calldata _tokenIds) external"
];

const AAVEGOTCHI_FACET_ABI = [
  "function tokenIdsOfOwner(address _owner) external view returns (uint32[] memory tokenIds_)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider('https://mainnet.base.org');
  const signer = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
  
  const AAVEGOTCHI_DIAMOND = "0xA99c4B08201F2913Db8D28e71d020c4298F29dBF";
  const GOTCHI_OWNER = "0xCE3214768474F006C50189D2d9583f19e3791f96";
  
  console.log("🎮 Manual Aavegotchi Petting (Bypassing LazyPetter)");
  console.log(`Signer: ${signer.address}`);
  
  try {
    // Get the Aavegotchis
    const aavegotchiFacet = new ethers.Contract(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_FACET_ABI, provider);
    const tokenIds32 = await aavegotchiFacet.tokenIdsOfOwner(GOTCHI_OWNER);
    
    console.log(`Found ${tokenIds32.length} Aavegotchis to pet`);
    
    if (tokenIds32.length === 0) {
      console.log("❌ No Aavegotchis found!");
      return;
    }
    
    // Convert to uint256 array
    const tokenIds = tokenIds32.map(id => BigInt(id));
    console.log(`Token IDs: ${tokenIds.map(id => id.toString()).join(', ')}`);
    
    // Call interact directly on the diamond
    const aavegotchiGameFacet = new ethers.Contract(AAVEGOTCHI_DIAMOND, AAVEGOTCHI_GAME_FACET_ABI, signer);
    
    console.log("🚀 Calling interact directly...");
    const tx = await aavegotchiGameFacet.interact(tokenIds);
    
    console.log(`📤 Transaction sent: ${tx.hash}`);
    console.log(`🔗 View on Basescan: https://basescan.org/tx/${tx.hash}`);
    
    const receipt = await tx.wait();
    console.log(`✅ Petting successful! Block: ${receipt.blockNumber}`);
    
  } catch (error) {
    console.error("❌ Error:", error.message);
    
    if (error.message.includes("not approved")) {
      console.log("ℹ️  You need to be the owner OR have pet operator permission");
    }
  }
}

main().catch(console.error);