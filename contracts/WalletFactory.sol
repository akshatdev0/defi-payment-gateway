// SPDX-License-Identifier: MIT
pragma solidity 0.8.6;

import "@openzeppelin/contracts/access/AccessControl.sol";

import "./Wallet.sol";

contract WalletFactory is AccessControl {
    bytes32 public constant APP_ROLE = keccak256("APP_ROLE");

    address public treasury;

    event WalletCreated(bytes32 identifier, address indexed walletAddress);
    event TreasuryUpdated(address indexed oldTreasury, address indexed newTreasury);

    constructor(
        address admin_,
        address app_,
        address treasury_
    ) {
        require(admin_ != address(0), "WalletFactory: new admin is the zero address");
        require(app_ != address(0), "WalletFactory: new app is the zero address");
        require(treasury_ != address(0), "WalletFactory: new treasury is the zero address");
        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(APP_ROLE, app_);
        treasury = treasury_;
    }

    function createWallet(bytes32 identifier) external onlyRole(APP_ROLE) {
        Wallet wallet = new Wallet{ salt: identifier }();
        wallet.initialize(address(this));
        emit WalletCreated(identifier, address(wallet));
    }

    function transferFrom(
        address wallet,
        address token,
        uint256 amount
    ) external onlyRole(APP_ROLE) returns (bool) {
        return Wallet(wallet).transfer(token, treasury, amount);
    }

    function updateTreasury(address newTreasury) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(newTreasury != address(0), "WalletFactory: new treasury is the zero address");
        address oldTreasury = treasury;
        treasury = newTreasury;
        emit TreasuryUpdated(oldTreasury, newTreasury);
    }
}
