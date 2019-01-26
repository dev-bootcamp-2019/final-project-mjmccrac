pragma solidity ^0.5.0;

/*
import "./Final.sol";

contract Registry{
  address backend;
  address[] prevBackends;
  address owner;

  constructor (address newBackend) public{
    owner = msg.sender;
    backend = newBackend;
  }

  modifier onlyOwner(){
    require(msg.sender == owner);
    _;
  }

  function changeBackend(address newBackend) public onlyOwner() returns (bool){
    if(newBackend !=backend){
      prevBackends.push(backend);
      backend = newBackend;
      return true;
    }
    return false;
  }

  function() external payable {
    (bool success, bytes memory data) = backend.delegatecall(msg.data);
    if (!success){revert();}

  }
}
*/
