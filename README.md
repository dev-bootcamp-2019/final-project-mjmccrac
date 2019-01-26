# Ethereum Store

**node_modules folder was too large to import to GitHub: Please run npm install from this directory to reinstall all needed modules before running!**

## General Description
This app is a decentralized store with 3 types of users: admins, sellers, and buyers.
Admins control which addresses have seller or admin privileges.
Sellers can post an item for sale or for auction.
Buyers can purchase an item if it is for sale, or bid if it is for auction.

## Launching the Contract
The solidity contract can be deployed and interacted with by running: truffle compile, and truffle migrate (once ganache-cli is running). Truffle v5.0.0 was used for development. The solidity contracts can be tested with "truffle test".

## Running the App
Once the contract is launched, navigate to the directory in a new terminal and execute "npm run dev". This will launch a web browser window with the web app running.
The contract can also be run in Rinkeby - see deployed_addresses.
You may need to hit refresh to update the dispay.

## Using the Web App
Metamask and Ganache are recommended for interacting with the app. The first address (address[0]) is the contract owner and by default is the only admin. Under this address, you can add other addresses using controls on the left column to give them either admin or seller privileges.

### Selling (For a fixed price)
As an address with seller privileges, use the middle column to set up a sale. Give a name and price to your item, and then optionally add an image to it. Click "Sell Item". It is now visible to buyers.

### Auctioning
As an address with seller privileges, give a name to your item and then optionally add an image to it. Click "Auction Item". It is now visible to buyers. (Note: All auctions start at $0 initial price.)

### Adding an image
Images can be optionally added to a product before putting it up for sale/auction. Images are selected from your hard drive and should be small (the smaller the better) and in jpeg format. When you select an image it is uploaded to IPFS so the hash can be stored in the blockchain. This uploading process takes a few seconds so the "Sell Item" and "Auction Item" buttons ae temporarily disabled. If IPFS hangs up / freezes, just refresh the page and try again.

### Buying / Bidding
The right column is for buyers. Use the "Prev" and "Next" buttons to cycle through items for sale. If an item is for sale for a fixed price, click "buy" to purchase. If an item is up for auction, click "bid" and you will be prompted to enter your bid. Your bid is deducted from your eth balance, so you can't back out later. Once the auction is finished, the seller gets paid and the winner gets title to the item. All other bidders can click "withdraw" to reclaim the eth they bid.

### Other features
Basic features described above are available on the current web app. Other features are available in the smart contract but not yet implemented on the app.
- Each user has a rating. After you sell a product and the buyer receives it, they can rate their satisfaction. An overall rating and total number of sold items is saved for each seller, so the buyer can tell which sellers are reliable.
- Admins can blacklist participants to prevent them from buying or selling. This can prevent malicious actors.

## Test Usage Instructions
- Start the app with "npm run dev"
- Copy the user address and paste it in the "Affected Address" text box. Click "Add Seller" and approve with Metamask.
- In the middle column, "Seller Controls", enter a name and price. Select a jpeg image and wait around 5 seconds for it to load into IPFS (if it hangs for more than that, refresh and try again - sorry I can't figure out how to get consistency out of IPFS!).
- Use metamask to change to address 2.
- Cycle through for sale items with "next" button.
- Purchase the item.
- Repeat for Auction process.

## Library

To demonstrate usage of a library, the seller profile is stored in a library along with getter and setter functions.
