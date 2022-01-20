// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

import "./Wallet.sol";

contract WalletFactory is Initializable, OwnableUpgradeable {
    address public treasury;

    event WalletCreated(bytes32 identifier, address indexed walletAddress);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    function initialize(address owner_, address treasury_) public initializer {
        require(owner_ != address(0), "WalletFactory: new owner is the zero address");
        require(treasury_ != address(0), "WalletFactory: new treasury is the zero address");
        OwnableUpgradeable.__Ownable_init();
        _transferOwnership(owner_);
        _updateTreasury(treasury_);
    }

    function createWallet(bytes32 identifier) external onlyOwner {
        Wallet wallet = new Wallet{ salt: identifier }();
        wallet.initialize(address(this));
        emit WalletCreated(identifier, address(wallet));
    }

    function transferFrom(
        address wallet,
        address token,
        uint256 amount
    ) external onlyOwner returns (bool) {
        return Wallet(wallet).transfer(token, treasury, amount);
    }

    function updateTreasury(address newTreasury) public virtual onlyOwner {
        require(newTreasury != address(0), "WalletFactory: new treasury is the zero address");
        _updateTreasury(newTreasury);
    }

    function _updateTreasury(address newTreasury) internal virtual {
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
}
