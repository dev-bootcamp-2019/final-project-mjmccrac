pragma solidity ^0.5.0;

import "./FinalLibrary.sol";

/** Main contract for ethereum store **/
contract Final {
  // State variables
  address owner;
  uint adminCount;
  uint sellerCount;
  uint blacklistCount;
  uint itemCount;
  uint constant maxAuctionTime = 60*60*24*30; // 1 Month Max Auction TIME
  uint constant minGasCost = 20000; // Note - Dec 2018 gas = 20,000 GWEI
  uint constant MaxRating = 100;

  // Flag for circuit breaker pattern
  bool private stopped;

  /** Start contract by defining owner and making him an admin**/
  constructor() public {
    stopped = false;
    owner = msg.sender;
    admins [owner] = 1;  adminCount = 1;
    itemCount = 0;
    sellerCount = 0;
    blacklistCount = 0;
  }

  // Make reader-friendly enum for state of a sale
  enum State{ForSale, ForAuction, Sold, Shipped, Received}

  // Events emitted when the state of a sale changes
  event ForSale(uint itemNumber);
  event ForAuction (uint itemNumber);
  event Sold (uint itemNumber);
  event Shipped(uint itemNumber);
  event Received (uint itemNumber);
  event HighestBidIncreased(uint itemNumber, address bidder, uint amount);
  event AuctionEnded(address winner, uint amount);

  /** Only one item type
  * reused for both sales and auctions
  * to reduce complexity of code.
  * Simplicity is prioritized to minimize
  * possible security flaws
  **/
  struct Item{
    uint itemNumber;
    string name;
    uint category;
    uint price;
    State state;
    address payable seller;
    address payable buyer;
    uint auctionStartTime;
    uint auctionLengthTime;
    address payable highestBidder;
    uint highestBid;
    string ipfsHash; //link to picture
  }

//------------------------------------------------------------------------
/** List all modifiers **/
  /** Circuit Breaker Modifiers **/
  modifier stopInEmergency { if (!stopped) _; }
  modifier onlyInEmergency { if (stopped) _; }

  /** Permission modifiers **/
  modifier isOwner{require(msg.sender == owner);_;}
  modifier isAdmin{require (admins[msg.sender]==1);_;}
  modifier isSeller{require (sellers[msg.sender]==1);  _;  }
  modifier isNotBlacklisted{require(blacklist[msg.sender] ==0); _;}

  /** Verify sales have correct inputs **/
  modifier verifyCaller (address _address) { require (msg.sender == _address); _;}
  modifier isEnoughMoney(uint _price){require(_price <= msg.value); _;}
  modifier isDuringAuction (uint _start, uint _length){
    require (now >= _start);
    require (now < (_start + _length));
    _;
  }
  modifier isValidBid (uint _currentMaxBid){require(msg.value > _currentMaxBid); _;}

  /** Verify correct item state **/
  modifier isForSale(State _state){require(_state == State.ForSale); _;}
  modifier isForAuction(State _state){require(_state == State.ForAuction); _;}
  modifier isSold (Item memory item) { require(item.state == State.Sold); _;}
  modifier isShipped (Item memory item) { require(item.state == State.Shipped); _;}
  modifier isReceived (Item memory item) { require(item.state == State.Received); _;}

//------------------------------------------------------------------------
  /** Circuit Breaker can be triggered by owner **/
  function toggleStop() isAdmin public {
      stopped = !stopped;
  }

  /** Total number of items that have ever been auctioned or sold **/
  function getNumItems() public view returns (uint){
    return(itemCount);
  }

  /** Next several functions check and set permissions **/
  /** verify whether address is an admin */
  function checkAdmin (address addr) public view returns (uint){
    return(admins[addr]);
  }

  /** verify whether an address is a seller*/
  function checkSeller(address addr) public view returns (uint){
    return(sellers[addr]);
  }

  /** verifies whether an address is blacklisted*/
  function checkBlacklist(address addr) public view returns (uint){
    return(blacklist[addr]);
  }

  /** add or remove an admin */
  function addAdmin (address newAdmin) public payable isAdmin{
    require(admins[newAdmin] ==0 && blacklist[newAdmin] ==0);
    admins[newAdmin] = 1; adminCount++;
  }
  function removeAdmin (address newAdmin) public isAdmin{
    require(admins[newAdmin] == 1 && adminCount > 0);
    admins [newAdmin] = 0;adminCount--;
  }

  /** Add or remove a seller*/
  function addSeller (address newSeller) public payable isAdmin{
    require(sellers[newSeller] == 0 && blacklist[newSeller] ==0);
    sellers [newSeller] = 1; sellerCount++;
    Lib.setJoinDate(sellerProfiles, now, newSeller);
  }
  function removeSeller (address newSeller) public isAdmin{
    require(sellers[newSeller] == 1 && sellerCount > 0);
    sellers [newSeller] = 0; sellerCount--;
  }

  /** Add or remove someone from the blacklist*/
  function addBlacklist (address newBlacklist) public isAdmin{
    require(blacklist[newBlacklist] ==0);
    blacklist[newBlacklist] = 1; blacklistCount++;
  }
  function removeBlacklist (address newBlacklist) public isAdmin{
    require(blacklist[newBlacklist] ==1);
    blacklist[newBlacklist] = 0; blacklistCount--;
  }

  /** mappings*/
  mapping (address=>uint) admins;
  mapping (address=>uint) sellers;
  Lib.SellerList sellerProfiles;
  mapping (address=>uint) blacklist;
  mapping (uint=>Item) items;
  mapping (address=>uint) pendingReturns;

  //------------------------------------------------------------------------

  /**  addItem puts an item up for either sale or auction
  * Ony seller can add items
  * Can be either auction or straight up sale
  * Auctions start immediately with no minimum bid
  */
  function addItem(string memory _name, uint _price, State _state, uint _auctionLengthTime, string memory _ipfsHash)
  isSeller isNotBlacklisted stopInEmergency public returns(bool){
    require ((_state == State.ForSale || _state == State.ForAuction) &&
      (_auctionLengthTime >= 0 && _auctionLengthTime < maxAuctionTime));
    //emit ForSale(itemCount);
    items[itemCount] = Item({
      name: _name,
      itemNumber: itemCount,
      category:0,
      price: _price,
      state: _state,
      seller: msg.sender,
      auctionStartTime: now,
      auctionLengthTime: _auctionLengthTime,
      highestBidder: 0x0000000000000000000000000000000000000000,
      highestBid:0,
      ipfsHash: _ipfsHash,
      buyer: 0x0000000000000000000000000000000000000000
    });
    itemCount++;
    return true;
  }

  /**
  *  submitBid
  * if it is an auction, submit your bid
  * if your bid is highest, the previous high highBidder
  * has hid bid set aside so he can withdraw it separately
  */
  function submitBid (uint itemNumber) public payable //Can be public because of isForAuction modiier
    isNotBlacklisted isForAuction(items[itemNumber].state)
    isDuringAuction(items[itemNumber].auctionStartTime, items[itemNumber].auctionLengthTime)
    isValidBid(items[itemNumber].highestBid)
    stopInEmergency
  {
      if (items[itemNumber].highestBidder != 0x0000000000000000000000000000000000000000){
        pendingReturns[items[itemNumber].highestBidder] += items[itemNumber].highestBid;}
      items[itemNumber].highestBidder = msg.sender;
      items[itemNumber].highestBid = msg.value;
      emit HighestBidIncreased(itemNumber, msg.sender, msg.value);

  }

  /**
  *  auctionEnd
  * Can be called by either winning bidder or seller
  * once the auction time has expired
  * The item is now transferred to the winner
  * and the ether to the seller
  */
  function auctionEnd (uint itemNumber) isForAuction(items[itemNumber].state) public payable {

    // Auction can be ended by seller, winning bidder, or administrator
    require( (items[itemNumber].highestBidder == msg.sender) ||
      (items[itemNumber].seller == msg.sender) ||
      (admins[msg.sender] == 1));
    require(items[itemNumber].state == State.ForAuction);
    require(items[itemNumber].highestBid > minGasCost);
    require(now > items[itemNumber].auctionStartTime + items[itemNumber].auctionLengthTime);
    items[itemNumber].state = State.Sold;
    address payable _seller = items[itemNumber].seller;
    uint _price = items[itemNumber].highestBid;
    _seller.transfer(_price);
    Lib.addSale(sellerProfiles, items[itemNumber].seller);
  }

  /**
  *  withdraw
  * If you did not win the auction, you can withdraw
  * your losing bid
  */
  function withdraw() public payable {
      uint amount = pendingReturns[msg.sender];
      if (amount > 0) {
        pendingReturns[msg.sender] = 0;
        msg.sender.transfer(amount);
      }
  }

  /**
  *  buyItem
  * purchase for a fixeed Price
  * Money goes directly to seller
  */
  function buyItem(uint itemNumber) public payable //Can be public because of isForSale modiier
  isNotBlacklisted
  isForSale(items[itemNumber].state)
  isEnoughMoney(items[itemNumber].price)
  stopInEmergency
  {
    items[itemNumber].seller.transfer(items[itemNumber].price);
    items[itemNumber].buyer =  msg.sender;
    items[itemNumber].state = State.Sold;

    emit Sold(itemNumber);
    Lib.addSale(sellerProfiles, items[itemNumber].seller);

    uint _price = items[itemNumber].price;
    uint amountToRefund = msg.value - _price;
    items[itemNumber].buyer.transfer(amountToRefund);
  }

  function shipItem(uint itemNumber) public
  isSold (items[itemNumber]) verifyCaller(items[itemNumber].seller){
    items[itemNumber].state = State.Shipped;
    emit Shipped(itemNumber);
  }

  /**
  *  receiveItem
  * Update supply chain information
  * Allow the buyer to rate the seller once item is received
  */
  function receiveItem(uint itemNumber, bool rateSeller, uint _sellerRating)
  public isShipped (items[itemNumber]) verifyCaller(items[itemNumber].buyer) {
    items[itemNumber].state = State.Received;
    emit Received(itemNumber);
    if (rateSeller == true){
      require (_sellerRating >= 0 && _sellerRating <= MaxRating);
      Lib.addRating(sellerProfiles, items[itemNumber].seller, _sellerRating);
    }
    // reset variables to 0 to free up memory and get back Eth
  }

  /**
  *  getIpfsHash
  * Return the ipfs hash of the image of the product for sale
  */
  function getIpfsHash(uint itemNumber) public view returns(string memory){
    require(itemNumber <= itemCount);
    return items[itemNumber].ipfsHash;
  }

  /**
  *  getItemData
  * Return as much of the item data as Solidity's stack can hold
  * Have to return highest bidder and ipfsHash separately
  */
  function getItemData(uint itemNumber) public view
    returns (string memory _name, uint _price, uint _auctionStart, uint _auctionLength,
    uint _highestBid, State _state, address _seller){
    require(itemNumber <= itemCount);
    return(items[itemNumber].name,
      items[itemNumber].price,
      items[itemNumber].auctionStartTime,
      items[itemNumber].auctionLengthTime,
      items[itemNumber].highestBid,
      items[itemNumber].state,
      items[itemNumber].seller);
  }

  /**
  *  getHighBidder
  * Return the current highest bidder for an auction
  * The returns for "getItemData" were maxed out so
  * this had to be in a separate function
  */
  function getHighBidder(uint itemNumber) public view returns(address){
      require(itemNumber <= itemCount);
      return items[itemNumber].highestBidder;
    }

}
