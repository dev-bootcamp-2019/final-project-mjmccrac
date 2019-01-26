var  mnemonic = "cover dish focus gift amount curtain napkin off dress mother brief book";
// corresponding address: 0xD0DF09f0840D6D516A1d5C4Fb1F871E642e3652c
// other Rinkeby address: 0xbe3a38ea8af556f2aa851e69b953ba7cf5335a66
//var infura = "https://rinkeby.infura.io/v3/69e4a9f655cc4bf8b94e6df443f5a80f"; // prev project
var infura = "https://rinkeby.infura.io/v3/6b0abe807b8a4b51abc4f9e69be45934";
//var infura = "https://rinkeby.infura.io/69e4a9f655cc4bf8b94e6df443f5a80f";
//https://rinkeby.infura.io/v3/69e4a9f655cc4bf8b94e6df443f5a80f
//69e4a9f655cc4bf8b94e6df443f5a80f
var HDWalletProvider = require("truffle-hdwallet-provider");

module.exports = {
  // See <http://truffleframework.com/docs/advanced/configuration>
  // for more about customizing your Truffle configuration!
  networks: {
    development: {
      host: "127.0.0.1",
      port: 8545,
      network_id: "*" // Match any network id
    },
    rinkeby: {
          provider: new HDWalletProvider(mnemonic, infura),
          network_id: "4",
          gas: 4500000
    },
    mocha: {
       timeout: 100000
    }
  }/*
  compilers: {
    solc: {
    }
  }*/
};
