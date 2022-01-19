// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract Wallet is Initializable, Ownable {
    function initialize(address owner_) external initializer {
        require(owner_ != address(0), "Wallet: new owner is the zero address");
        _transferOwnership(owner_);
    }

    function transfer(
        address token,
        address recipient,
        uint256 amount
    ) external onlyOwner returns (bool) {
        return IERC20(token).transfer(recipient, amount);
    }
}
