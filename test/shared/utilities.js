const { ethers } = require("ethers");
const { getAddress, keccak256, toUtf8Bytes, parseEther } = ethers.utils;

exports.keccak = n => {
  return keccak256(toUtf8Bytes(n));
};

exports.bigNumberify = n => {
  return ethers.BigNumber.from(n);
};

exports.getCreate2Address = (sender, salt, bytecode) => {
  const create2Inputs = ["0xff", sender, salt, keccak256(bytecode)];
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join("")}`;
  return getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
};

exports.getCreate2TronAddress = (sender, salt, bytecode) => {
  const create2Inputs = ["0x41", sender, salt, keccak256(bytecode)];
  const sanitizedInputs = `0x${create2Inputs.map(i => i.slice(2)).join("")}`;
  const ethAddress = getAddress(`0x${keccak256(sanitizedInputs).slice(-40)}`);
  return tronWeb.address.fromHex(`41${ethAddress.slice(2)}`);
};

exports.keccak256 = keccak256;

exports.parseEther = parseEther;
