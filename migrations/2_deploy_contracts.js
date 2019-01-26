var Final = artifacts.require("Final");
//var registry = artifacts.require("Registry");


module.exports = function(deployer) {
  deployer.deploy(Final);
  //deployer.deploy(registry);
};
