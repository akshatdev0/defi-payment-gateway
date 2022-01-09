// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

import "./Wallet.sol";

contract WalletFactory is Initializable, ReentrancyGuardUpgradeable, OwnableUpgradeable {
    mapping(bytes32 => address) public getWallet;
    mapping(address => bytes32) public getIdentifier;
    address[] public allWallets;

    event WalletCreated(bytes32 identifier, address indexed walletAddress, uint256);

    function initialize(address owner) public initializer {
        OwnableUpgradeable.__Ownable_init();
        ReentrancyGuardUpgradeable.__ReentrancyGuard_init();
        _transferOwnership(owner);
    }

    function totalWallets() external view returns (uint256) {
        return allWallets.length;
    }

    function createWallet(bytes32 identifier) external onlyOwner returns (address walletAddress) {
        bytes32 salt = keccak256(abi.encodePacked(identifier));
        Wallet wallet = new Wallet{ salt: salt }();
        wallet.initialize();
        walletAddress = address(wallet);
        getWallet[identifier] = walletAddress;
        getIdentifier[walletAddress] = identifier;
        allWallets.push(walletAddress);
        emit WalletCreated(identifier, walletAddress, allWallets.length);
    }
}
