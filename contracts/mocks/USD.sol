// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USD is ERC20 {
    constructor() ERC20("USD", "USD") {
        _mint(msg.sender, 1_000_000 * (10**6));
    }

    function decimals() public view virtual override returns (uint8) {
        return 6;
    }
}
