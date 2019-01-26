# Avoiding Common Attacks
## Reentrancy Attacks
For auctions, the withdrawal (pull over push payment) design pattern is used. Every time a user bids on an item and sends eth to the contract, the previous high bidder gets his bid relegated to a "pendingReturns" ledger. He can then withdraw this amount in a separate function which sets his "pendingReturns" balance to zero, preventing reentrancy.

For sales (fixed-price), the code is all executed before transferring money to the seller. This includes setting the item flag to "Sold" from "ForSale". This protects against reentrancy.

## Timestamp Dependence
The auction function is dependent on timestamps from the Ethereum blockchain. There is no mre reliable way of executing the auction, so this problem is minimized by only counting the auction in terms of hours and minutes. Counting seconds is considered to precise for the timestamps, so seconds are never displayed.

## Integer Overflow and Underflow
Numbers are checked against an allowable range before being used.

## Denial of Service Attack in Auction
A denial of service attack could be launched against the auction if the auction directly transferred the bid refund to the bidder. If the bidder was a contract (as opposed to a private account) they could have a fallback function that always reverts, which disables bidding for anyone else. This is avoided using the withdrawal (pull over push payment) design pattern.
