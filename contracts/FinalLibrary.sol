pragma solidity ^0.5.0;

/**  Lib contains profile data for sellers */
library Lib{

  /**
  *  SellerProfile
  * all profile data for seller
  * ipfsHash to be implemented later
  */
  struct SellerProfile{
    //address sellerAddress;
    uint sellerRating;
    uint numRatings;
    uint numSales;
    uint joinDate;
    // IPFS profile picture Hash to be added later
  }

  /**  SellerList the main mapping variable */
  struct SellerList{
    mapping(address=>SellerProfile) sellerProfiles;
  }

  /**  setJoinDate sets when the person became a seller */
  function setJoinDate(SellerList storage self, uint _joinDate, address a) internal {
    require(self.sellerProfiles[a].joinDate == 0);
    self.sellerProfiles[a].joinDate = _joinDate;
  }
  /**  addSale increments the number of sales in this person's name */
  function addSale(SellerList storage self, address a) internal {
    self.sellerProfiles[a].numSales ++;
  }
  /**  getJoinDate tells us when this address became a seller */
  function getJoinDate(SellerList storage self, address a) public view returns (uint){
    return self.sellerProfiles[a].joinDate;
  }
  /**  getNumSales tells how many sales came from this address */
  function getNumSales(SellerList storage self, address a) public view returns (uint){
    return self.sellerProfiles[a].numSales;
  }
  /**  addRating lets the buyer rate the seller */
  function addRating(SellerList storage self, address a, uint _sellerRating)internal {
    uint rating = self.sellerProfiles[a].sellerRating;
    uint numRatings = self.sellerProfiles[a].numRatings;
    self.sellerProfiles[a].sellerRating = uint(((rating * numRatings) + _sellerRating) / (numRatings + 1));
    self.sellerProfiles[a].numRatings++;
  }

}
