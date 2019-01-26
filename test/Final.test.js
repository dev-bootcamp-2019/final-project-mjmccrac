var Final = artifacts.require('Final');

contract('Final', function(accounts) {

  const alice = accounts[0]     // admin, buyer
  const bob = accounts[1]       // buyer
  const charlie = accounts[2]   // buyer

// Test 1: give seller privileges to everyone, and give admin privileges to bob
it("should give everyone seller privileges and should give bob admin privileges", async() => {

  const FinalInstance = await Final.deployed();
  await FinalInstance.addSeller(bob, {from: alice});
  await FinalInstance.addAdmin(bob, {from: alice});
  await FinalInstance.addSeller(charlie, {from: alice});
  //----------------------------------------------------
  var bobSeller = await FinalInstance.checkSeller.call(bob, {from: bob});
  const bobAdmin = await FinalInstance.checkAdmin.call(bob, {from: bob});
  const charlieSeller = await FinalInstance.checkSeller.call(charlie, {from: bob});
  //----------------------------------------------------
  assert.equal(bobSeller, 1, 'bob should have seller privileges');
  assert.equal(bobAdmin, 1, 'bob should have admin privileges');
  assert.equal(charlieSeller, 1, 'charlie should have seller privileges');

})

// Test 2: bob sells an item {"car", 1 Eth}, and charlie buys it
it("bob should post a car for sale for 1 Eth and charlie should buy it", async() => {
  const FinalInstance = await Final.deployed();
  var itemName = "car";
  var itemNum = 0;
  const itemPrice = web3.utils.toWei('1', "ether");//
  var state = 0; // for sale
  var sale = await FinalInstance.addItem(itemName, itemPrice, state, 0, "0", {from: bob});
  //----------------------------------------------------
  var bobBeforeBalance = await web3.eth.getBalance(bob)
  var charlieBeforeBalance = parseFloat(await web3.eth.getBalance(charlie))
  await FinalInstance.buyItem(itemNum, {from:charlie, value:itemPrice});
  var bobAfterBalance = await web3.eth.getBalance(bob)
  var charlieAfterBalance = parseFloat(await web3.eth.getBalance(charlie))
  const res = await FinalInstance.getItemData.call(itemNum);//_name, _price, _aSt, _aL, _hBid, _state, _seller)
  // ----------------------------------------------------
  assert.equal((bobAfterBalance-(bobBeforeBalance)), itemPrice, 'bobs account should increase by the price');
  assert.isBelow(charlieAfterBalance, (charlieBeforeBalance-itemPrice), 'due to gas charlies balance should drop by more than the price');
  assert.equal(res[0], itemName, 'item name should be the same')
  assert.equal(res[1], itemPrice, 'item price should be the same')
  assert.equal(res[6], bob, 'bob should still be the seller of record')
  // buyer is semi-confidential so no assert for him
})

// Test 3: bob auctions a radio. alice bids 2, charlie bids 3, time expires and bob ends auction, alice withdraws refund.
it("bob auctions a radio. charlie outbids alice and wins the auction. alice gets her eth refunded", async() => {
  const FinalInstance = await Final.deployed();
  var itemName = "radio";
  var itemNum = 1;
  var time = 3;
  const aliceBid = web3.utils.toWei('2', "ether");
  const charlieBid = web3.utils.toWei('3', "ether");
  var bobBeforeBalance = parseFloat(await web3.eth.getBalance(bob))
  var aliceBeforeBalance = parseFloat(await web3.eth.getBalance(alice))
  var state = 1;
  //-----------------------------------------------------
  function wait(ms){
   var start = new Date().getTime();
      var end = start;
      while(end < start + ms) {
        end = new Date().getTime();
      }
  }
  //-----------------------------------------------------
  var sale = await FinalInstance.addItem(itemName, 100, state, time, "0", {from:bob})
  var startTime =  Date.now()/1000;
  await FinalInstance.submitBid(itemNum, {from:alice, value:aliceBid});
  await FinalInstance.submitBid(itemNum, {from:charlie, value:charlieBid});
  wait((time+1)*1000);
  await FinalInstance.auctionEnd(itemNum, {from:bob});
  await FinalInstance.withdraw({from:alice});
  const highBidder = await FinalInstance.getHighBidder.call(itemNum);
  var bobAfterBalance = parseFloat(await web3.eth.getBalance(bob))
  var aliceAfterBalance = parseFloat(await web3.eth.getBalance(alice))
  //-----------------------------------------------------
  assert.equal(highBidder, charlie, 'charlie wins auction');
  assert.isBelow(bobBeforeBalance, bobAfterBalance, 'bobs balance increased');
  assert.isBelow(aliceBeforeBalance - parseFloat(aliceBid), aliceAfterBalance, 'alices balance decreased by gas cost which is less than the amount of her bid (she got a refund)')
})

// Test 4: bob posts an item for auction with all properties. then query them all to verify
it("bob auctions a radio, and we confirm its name, auction length, the current high bid, the IPFS hash, and the seller", async() => { //_name, _price, _aSt, _aL, _hBid, _state, _seller
  const FinalInstance = await Final.deployed();
  var itemName = "TestItem";
  var itemNum = 2;
  var time = 3;
  var ipfsHash = "0"
  var state = 1;
  //-----------------------------------------------------
  var sale = await FinalInstance.addItem(itemName, 100, state, time, ipfsHash, {from: bob})
  var ipfsResult = await FinalInstance.getIpfsHash(itemNum);
  const res = await FinalInstance.getItemData.call(itemNum);//_name, _price, _aSt, _aL, _hBid, _state, _seller)
  const highBid = parseFloat(res[4]);
  //-----------------------------------------------------
  assert.equal(res[0], itemName, 'item name should be the same');
  assert.equal(res[3], time, 'auction length');
  assert.equal(highBid, 0, 'high bid should be zero');
  assert.equal(ipfsHash, ipfsResult, 'high bid should be zero');
  assert.equal(res[6], bob, 'seller should be the same');

})
// Test 5: alice removes seller privileges from bob and blacklists charlie
it("alice removes seller privileges from bob and blacklists charlie", async() => {
  const FinalInstance = await Final.deployed();
  var bobSellerPrivBefore = await FinalInstance.checkSeller.call(bob, {from:bob});
  var charlieBannedBefore = await FinalInstance.checkBlacklist.call(charlie, {from:charlie});
  //-----------------------------------------------------
  await FinalInstance.removeSeller(bob, {from:alice});
  await FinalInstance.addBlacklist(charlie, {from:alice});
  //-----------------------------------------------------
  var bobSellerPrivAfter = await FinalInstance.checkSeller.call(bob, {from: bob}); //FinalInstance.checkSeller.call();
  var charlieBannedAfter = await FinalInstance.checkBlacklist.call(charlie, {from:alice});
  //-----------------------------------------------------
  assert.equal(bobSellerPrivBefore, 1, 'bob started out with seller privileges');
  assert.equal(bobSellerPrivAfter, 0, 'bob ends with no seller privileges');
  assert.equal(charlieBannedBefore, 0, 'at first charlie was not blacklisted');
  assert.equal(charlieBannedAfter, 1, 'charlie ends up blacklisted')

})

})
