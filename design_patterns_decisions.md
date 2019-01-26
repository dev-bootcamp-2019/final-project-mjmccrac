# Design Patterns
The following design patterns are applied in this project:
## Circuit Breaker
The contract has a global boolean "stopped". By default it is "false". There is a function accessible only to the owner who launched the contract to toggle it between true and false. Modifiers are provided to require "stopped" to be true (for functions that can only be executed during an emergency stop - so far none of these functions exist), or for "stopped" to be "false" (for functions which can not be executed in an emergency stop). Functions which are disabled during an emergency are functions which allow a user to post new items for sale or accept new money into the contract. Users are always allowed to withdraw their funds or complete a sale / auction.
## Fail Early & Fail Loud
Each function starts with modifiers and require statements to reject any invalid inputs before doing anything else.
## Restricted Access
All functions pertaining to selling or administering the site are permissioned with modifiers, so that only an Admin has access to admin functions, and only a Seller has access to seller functions.
## Pull over Push Payments
Superseded bids in the auction process are not immediately returned to the bidder, but are added to a balance that the bidder must actively withdraw.
This pattern is only applied for the auction, and not for fixed-price sales. The reason is that in a fixed price sale, the item is flagged as sold before the money is transferred which provides protection from re-entrancy, and it is more convenient to have the money automatically transferred vs having to withdraw.
## Upgradable
I tried to get the upgradable pattern to work (see registry.sol) but I had difficulty getting return values from the contract so I gave up. Any feedback in this area would be appreciated.
