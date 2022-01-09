import { ethers } from "hardhat";
import { BigNumber } from "@ethersproject/bignumber";
const { getAddress, keccak256, toUtf8Bytes, solidityPack } = ethers.utils;

export function keccak(n: string): string {
  return keccak256(toUtf8Bytes(n));
}

export function bigNumberify(n: string | number): BigNumber {
  return ethers.BigNumber.from(n);
}

export function getCreate2Address(factoryAddress: string, identifier: string, bytecode: string): string {
  const create2Inputs = [
    "0xff",
    factoryAddress,
    keccak256(solidityPack(["bytes32"], [identifier])),
    keccak256(bytecode),
  ];
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join("")}`;
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
}
