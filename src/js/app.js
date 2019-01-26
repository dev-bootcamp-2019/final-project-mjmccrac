var currentItem = 0;
var itemCount = 0;
const states = ["For Sale", "For Auction", "Sold", "Shipped", "Received"];
const IpfsNode = new window.IpfsApi({ host: 'ipfs.infura.io', port: 5001, protocol: 'https' });


App = {


  web3Provider: null,
  userAddress:null,
  userBalance:0,
  ipfsHash: null,
  adminPriv: false,
  sellPriv: false,
  buffer: '',
  img: [],
  contracts: {},
  ipfsHash:"",

  item_name:null,
  item_price:0,
  item_auction_start:0,
  item_auction_length:0,
  item_auction_end:0,
  item_high_bid:0,
  item_high_bidder:null,
  item_state:0,
  item_seller:null,
  item_ipfsHash:"",
  auction_or_sell:0,


  quickTest: function() {
    var element = document.getElementById("test2");
    element.innerHTML = "QuickTest Works";
  },

  withdraw: function(){
    App.updateAccount();
    App.contracts.Final.deployed().then(function(instance) {
      FinalInstance = instance;
      FinalInstance.withdraw();
    });
  },

  updateAccount: function(){
    var addressElement = document.getElementById("userAddress");
    userAddress = web3.eth.accounts[0];
    addressElement.innerHTML = userAddress;

    var balanceElement = document.getElementById("userBalance");
    web3.eth.getBalance(userAddress, (err, wei) => {
      userBalance = web3.fromWei(wei, 'ether')
      balanceElement.innerHTML = userBalance;
    });
  },

  /*getHighBidder: function(){
    item_high_bidder =
  },*/
  endAuction: function(){
    // item_seller, item_high_bidder, userAddress
    if (userAddress == item_seller || userAddress == item_high_bidder){
      App.contracts.Final.deployed().then(function(instance) {
        FinalInstance = instance;
        FinalInstance.auctionEnd(currentItem);
        document.getElementById("btn-aucEnd").style.visibility = "hidden";
      });
    } else{alert("error!!!")}

  },

  bidItem: function(){
    // account > price, for sale
    App.updateAccount();
    if (userBalance > item_high_bid &&
       item_state == 1 &&
       userAddress != item_seller){
      App.contracts.Final.deployed().then(function(instance) {
        FinalInstance = instance;
        var nextBid = parseFloat(item_high_bid + 1);
        var bidVal = prompt("Enter Bid in eth", nextBid);
        FinalInstance.submitBid(currentItem,{from:web3.eth.accounts[0],
        value:web3.toWei(bidVal, 'ether'),
        gas:4000000});
      });
  //    App.listItems();
    }else{
      alert("Error: Can't bid. Balance: " + userBalance + ", state: " + item_state +
        ", user_add: " + userAddress + ", seller_add: " + item_seller);
    }
  },

  buyItem: function(){
    App.updateAccount();
    if ((userBalance > item_price) &&
       (item_state == 0) &&
       (userAddress != item_seller)){
        App.contracts.Final.deployed().then(function(instance) {
          FinalInstance = instance;
          FinalInstance.buyItem(currentItem,{from:web3.eth.accounts[0],
          value:web3.toWei(item_price, 'ether'),
          gas:4000000});
      });
  //    App.listItems();
    }else{
      alert("Error: Can't buy");
    }
  },

  listItems: function() {
     document.getElementById("btn-aucEnd").style.visibility = "hidden";
     var element = document.getElementById("test2");

      var FinalInstance;
      App.contracts.Final.deployed().then(function(instance) {
        FinalInstance = instance;
        element.innerHTML = "about to call";
        return FinalInstance.getNumItems.call();
      }).then(function(result) {
        if (result <0 || result > 1000) { alert("ERROR");}
        itemCount =parseInt(result);
      }).then (function(){
        element.innerHTML = "check item";
        if (currentItem < itemCount){
          element.innerHTML = "gonna get item";
          return FinalInstance.getItemData(currentItem);
        }else{
          alert("ERROR - Attempting to view item out of range");
        }
      }).then(function(res){
        item_name = res[0];
        item_price = parseFloat(web3.fromWei(parseInt(res[1]), 'ether'));
        item_auction_start = parseInt(res[2]);
        item_auction_length = parseInt(res[3]);
        item_auction_end = item_auction_start + item_auction_length;
        item_high_bid = parseFloat(web3.fromWei(parseInt(res[4]), 'ether'));
        item_state = parseInt(res[5]);
        item_seller = res[6];
        document.getElementById("current_item_name").innerHTML = "Name: " + item_name;
        document.getElementById("current_item_price").innerHTML = "Price: " + item_price + " eth";
        document.getElementById("auction_info").innerHTML = states[item_state];
        if (item_state == 0){
          document.getElementById("btn_buy_bid").style.visibility = "visible";
          document.getElementById("btn_buy_bid").innerHTML = "Buy";
          document.getElementById("auction_address").innerHTML = "";
        } else if (item_state == 1){
          var unixTime =  Date.now()/1000;//Math.round((new Date()).getTime() / 1000);
          var countdown = item_auction_end - unixTime;
          var countdown_hours = parseInt(countdown/3600);
          var countdown_min = parseInt((countdown - 3600*countdown_hours)/60);
          // Don't bother with seconds because ethereum timestamp lacks precision

          document.getElementById("btn_buy_bid").style.visibility = "visible";
          document.getElementById("btn_buy_bid").innerHTML = "Bid";
          document.getElementById("auction_address").innerHTML = "Current High Bid: " + item_high_bid;
          if (countdown > 0){
            document.getElementById("auction_info").innerHTML = states[item_state] + " Time Remaining: "
            + countdown_hours + " h, " + countdown_min + " min.";
          }else{
              document.getElementById("auction_info").innerHTML ="Auction finished. Click end auction button"
              document.getElementById("btn-aucEnd").style.visibility = "visible";
          }
        } else{
          document.getElementById("btn_buy_bid").style.visibility = "hidden";
        }
        return FinalInstance.getHighBidder(currentItem)
      }).then(function(res){
        item_high_bidder = res;
        document.getElementById("auction_address").innerHTML += " --> " + item_high_bidder;
      }).then(function(){
        return FinalInstance.getIpfsHash(currentItem)
      }).then (function(getHash){
        item_ipfsHash = getHash;
        if (item_ipfsHash != ""){
          App.IPFSdisplay(item_ipfsHash);
        }

      });

  },

  addSeller: function(isSeller) {

    var affectedAdd = document.getElementById("affectedAddress").value;
    if ((affectedAdd.length == 42) && (affectedAdd.startsWith("0x"))) {
     var element = document.getElementById("test2");

      var FinalInstance;
      App.contracts.Final.deployed().then(function(instance) {
        FinalInstance = instance;
        FinalInstance.addSeller(affectedAdd);
        element.innerHTML = "about to call";
      }).then(function() {
        return FinalInstance.checkSeller(userAddress);
      }).then(function(isSeller) {
        element.innerHTML = "isSeller";
      }).catch(function(err) {
        element.innerHTML = err.message;
      });
    } else {
      var element = document.getElementById("test2");
      element.innerHTML = "Not a valid Eth address";
    }
  },

  addAdmin: function(isAdmin) {

    var affectedAdd = document.getElementById("affectedAddress").value;
    if ((affectedAdd.length == 42) && (affectedAdd.startsWith("0x"))) {
     var element = document.getElementById("test2");

      var FinalInstance;
      App.contracts.Final.deployed().then(function(instance) {
        FinalInstance = instance;
        FinalInstance.addAdmin(affectedAdd);
      }).catch(function(err) {
        element.innerHTML = err.message;
      });
    } else {
      var element = document.getElementById("test2");
      element.innerHTML = "Not a valid Eth address";
    }
  },

  sellItem: function(isAdmin) {

    var element = document.getElementById("test2");

    var itemName = document.getElementById("itemName").value;
    var itemPrice = document.getElementById("itemPrice").value;
    var picturePath = document.getElementById("itemPhoto").value;

    var weiPrice = web3.toWei(itemPrice, 'ether');
    //var ipfsHash = "temporary_zero";
    var display = document.getElementById("design_display");
    element.innerHTML = weiPrice;
    var auctionLengthSeconds = 0;
    //1 Check that there is a name and Price
    if (auction_or_sell == 0 || auction_or_sell == 1){
    if (weiPrice > 0 && itemPrice < 1000){
      if (itemName.length > 0){
        element.innerHTML = "Sell OK";
        var FinalInstance;
        if (auction_or_sell ==1){
          var auctionLengthSeconds = parseInt(prompt("Enter length of auction (hours)", "1")*3600);
        }

          App.contracts.Final.deployed().then(function(instance) {
            FinalInstance = instance;
            FinalInstance.addItem(itemName, weiPrice, auction_or_sell, auctionLengthSeconds, ipfsHash);
          }).catch(function(err) {
            element.innerHTML = err.message;
          });
      }
      else{
        alert("Needs a name");
      }
    } else {
      alert("Invalid Price");
    }
  }else{
    alert("Invalid State");
  }


  },

  init: async function() {
    var element = document.getElementById("permissions");
    element.innerHTML = "Init Works";

    element.innerHTML = "Init Still Works";

    return await App.initWeb3();

  },

  initWeb3: async function() {

    if (window.ethereum) {
      App.web3Provider = window.ethereum;
      try {
        await window.ethereum.enable();
      } catch (error) {
        console.error("User denied account access")
      }
    }
    // Legacy dapp browsers...
    else if (window.web3) {
      App.web3Provider = window.web3.currentProvider;
    }
    // If no injected web3 instance is detected, fall back to Ganache
    else {
      App.web3Provider = new Web3.providers.HttpProvider('http://localhost:8545');
    }
    web3 = new Web3(App.web3Provider);

    return App.initContract();
  },

  initContract: function() {
    $.getJSON('Final.json', function(data) {
      var element = document.getElementById("test2");
      element.innerHTML = "initContract";
      var FinalArtifact = data;
      App.contracts.Final = TruffleContract(FinalArtifact);
      App.contracts.Final.setProvider(App.web3Provider);
      return App.updateInterface();
    });

    return App.bindEvents();
  },

  bindEvents: function() {
    //$(document).on('click', 'btn-update', App.quickTest;
    var updateButton = document.getElementById("btn-update");
    updateButton.addEventListener('click', function() {
      App.quickTest();
    });

    var addSellerButton = document.getElementById("btn-addSeller");
    addSellerButton.addEventListener('click', function() {
      App.addSeller();
    });

    var addAdminButton = document.getElementById("btn-addAdmin");
    addAdminButton.addEventListener('click', function() {
      App.addAdmin();
    });

    var sellButton = document.getElementById("btn-sellItem");
    sellButton.addEventListener('click', function() {
      auction_or_sell = 0;
      App.sellItem();
    });

    var auctionButton = document.getElementById("btn-aucItem");
    auctionButton.addEventListener('click', function() {
      auction_or_sell = 1;
      App.sellItem();
    });

    var listButton = document.getElementById("btn-List");
    listButton.addEventListener('click', function() {
      App.listItems();
    });

    var prevButton = document.getElementById("prev_button");
    prevButton.addEventListener('click', function() {
      currentItem--;
      if (currentItem < 0){currentItem = itemCount -1;}
      App.listItems();
    });

    var withdrawButton = document.getElementById("btn-withdraw");
    withdrawButton.addEventListener('click', function() {
      App.withdraw();
    });

    var testIpfsButton = document.getElementById("btn-testIPFS");
    testIpfsButton.addEventListener('click', function() {
      App.testIpfs();
    });

    var testIpfsButton2 = document.getElementById("btn-testIPFS2");
    testIpfsButton2.addEventListener('click', function() {
      App.IPFSdisplay(ipfsHash);
    });


    var endAucBtn = document.getElementById("btn-aucEnd");
    endAucBtn.addEventListener('click', function() {
      App.endAuction();
    });

    var itemFile = document.getElementById("itemPhoto");
    itemFile.addEventListener('change', function() {
      App.choosePhoto();
    });

    var nextButton = document.getElementById("next_button");
    nextButton.addEventListener('click', function() {
      currentItem++;
      if (currentItem >= itemCount){currentItem = 0;}
      App.listItems();
    });

    var buyBidButton = document.getElementById("btn_buy_bid");
    buyBidButton.addEventListener('click', function() {
      switch (item_state){
        case 0:
          App.buyItem();
          break;
        case 1:
          App.bidItem();
          break;
        default:
          alert("Can't buy at this time");
          break;
      }
    });

    var element = document.getElementById("permissions");
    element.innerHTML = "Bind Events Works";
  },


  updateInterface: function(isSeller, isAdmin) {
    //var itemCount = 0;
    App.updateAccount();

    var element = document.getElementById("permissions");

    var FinalInstance;

    App.contracts.Final.deployed().then(function(instance) {
      //var currentAccount = web3.eth.accounts[0];
      element.innerHTML = "Shopper";
      FinalInstance = instance;
      //alert(userAddress)
      return FinalInstance.checkSeller(userAddress); //return FinalInstance.getHighBidder(currentItem)
    }).then(function(isSeller) {
      //alert(isSeller)
      if (isSeller != 0) {
        sellerPriv = true;
        element.innerHTML += ", Seller";
      } else {
        sellerPriv = false;
      }
      // Do something with list of for sale items
      // retrieve product data (name, price, seller, ipfsHash, auction info, etc)
      // retrieve pictures from IPFS

    }).then(function() {
      return FinalInstance.checkAdmin.call(userAddress);
    }).then(function(isAdmin) {
      if (isAdmin != 0) {
        adminPriv = true;
        element.innerHTML += ", Admin";
      } else {
        adminPriv = false;
      }

    }).then(function(){

    }).catch(function(err) {
      console.log(err.message);
      var element = document.getElementById("test2");
      element.innerHTML = err.message;
    });

  },

  //---------------------------------------------------------------------

  choosePhoto: function(){
    var pathElement = document.getElementById("itemPhoto");
    var imageElement = document.getElementById("design_display");
    const filePath = pathElement.value;
    var f = pathElement.files[0];
      var reader = new FileReader()
      reader.onload = (function(theFile) {
        return function(e) {
          imageElement.src = e.target.result;
        }
      })(f);
     reader.readAsDataURL(f);
      App.testIpfs();
      return(1);
  },

  setProductPhoto: function() {

    var pathElement = document.getElementById("itemPhoto");
    IpfsNode.on('ready', () => {
      const file = pathElement.value;
      var reader = new FileReader()
      reader.onload = function(event) {
        image = ipfs.types.Buffer(e.target.result);
        addIPFS(image, function(hash) {
          var imageHash = hash;
      });
    };
    reader.readAsArrayBuffer(file);
    return (imageHash);
    })
  },

  //---------------------------------------------------------------------


  getImg: function(hash, refFunc) {

    var element = document.getElementById("test2");
    var buf =[];

    element.innerHTML = "in getImg0";
    App.contracts.Final.deployed().then(function(instance) {
      element.innerHTML = "Not working";
      // download image
      ipfs.on('ready', async () => {
          const version = await node.version()
          element.innerHTML = version.version;
      })
      element.innerHTML = "after getImg";
  }); // deployed

},


testIpfs: async function(){

  document.getElementById("btn-sellItem").disabled = true;
  document.getElementById("btn-aucItem").disabled = true;
  var pathElement = document.getElementById("itemPhoto");
  var imageElement = document.getElementById("design_display");
  const filePath = pathElement.value;
  var f = pathElement.files[0];
    var reader = new FileReader()
    reader.onloadend = (function(theFile) {
      image = window.IpfsApi().Buffer(reader.result);
      IpfsNode.files.add(image, (err, result) => { // Upload buffer to IPFS
        if(err || !result) {
          alert("error");
          document.getElementById("btn-sellItem").disabled = false;
          document.getElementById("btn-aucItem").disabled = false;
          return;
        }
        var imageHash = result[0].hash;
        alert("ipfs hash: " + imageHash);
        document.getElementById("btn-sellItem").disabled = false;
        document.getElementById("btn-aucItem").disabled = false;
        ipfsHash = imageHash;
  });
  })
   reader.readAsArrayBuffer(f);
  return(1);
},

IPFSdisplay: function(hash){
  var element = document.getElementById("current_item_display");
//  var url = 'https://ipfs.io/ipfs/${result[0].hash}'

  var buf = [];

  IpfsNode.files.cat(hash).then(function(stream) {
    stream.on('data', (file) => {
      data = Array.prototype.slice.call(file)
      buf = buf.concat(data)
    })
    stream.on('end', (file) => {
      if (typeof blob !== 'undefined') {
        //window.URL.revokeObjectURL(blob);
        //alert("blob revoked")
      }
      // create new blob
      buf = window.IpfsApi().Buffer(buf);
      blob = new Blob([buf], {type: "image/jpg" })
      img = window.URL.createObjectURL(blob);
      element.src = img;
    })
  }).catch(function(err){
    element.innerHTML = err;
  });
},

  //---------------------------------------------------------------------


}


$(function() {
  $(window).load(function() {
    document.getElementById("btn-aucEnd").style.visibility = "hidden";
    var element = document.getElementById("permissions");
    element.innerHTML = "Load Works";
    App.init();
  });
});
