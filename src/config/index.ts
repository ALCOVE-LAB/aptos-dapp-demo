import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';
import { Wallet } from '@aptos-labs/wallet-adapter-core';
import { PetraWallet } from 'petra-plugin-wallet-adapter';

// DApp支持的wallet列表
// https://github.com/aptos-labs/aptos-wallet-adapter
export const wallets: Wallet[] = [new PetraWallet()];

// 初始化AptosClient
// 用来连接 Aptos 区块链网络，提交Transaction，查询账户余额等操作
export const AptosClient = new Aptos(
  new AptosConfig({
    network: Network.TESTNET,
  }),
);

