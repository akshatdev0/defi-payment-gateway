// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Foo is ERC20 {
    constructor() ERC20("Foo", "FOO") {
        _mint(msg.sender, 100 * 1000 * 1000 * 1000);
    }
}
