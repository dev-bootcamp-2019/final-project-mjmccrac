
const IPFS = require('ipfs-http-client');//ERROR
const ipfs = new IPFS('localhost', '5001', {protocol:'http'});
export default ipfs;
