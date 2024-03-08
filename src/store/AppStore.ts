import { AptosClient, wallets } from '@/config';
import { HexInput } from '@aptos-labs/ts-sdk';
import { WalletCore } from '@aptos-labs/wallet-adapter-core';
import { defineStore } from 'pinia';

// AppStore Type
interface AppStore {
  walletCore: WalletCore;
  address: Ref<string | undefined>;
  balance: Ref<number>;
}

const WALLET_NAME = 'AptosWalletName';

const useAppStore = defineStore('appStore', (): AppStore => {
  const address = ref();
  const balance = ref(0);
  const walletCore = new WalletCore(wallets);

  // ============ wallet core 事件监听 ============
  // 监听账户切换
  walletCore.on('accountChange', () => {
    address.value = walletCore.account?.address;
  });

  // 监听连接事件
  walletCore.on('connect', () => {
    window.localStorage.setItem(WALLET_NAME, walletCore.wallet?.name || '');
    address.value = walletCore.account?.address;
    fetchBalance();
  });

  // 监听断开连接事件
  walletCore.on('disconnect', () => {
    address.value = undefined;
    balance.value = 0;
  });

  const autoConnect = ref(true);
  const connecting = ref(false);

  if (autoConnect) {
    setTimeout(async () => {
      if (window.localStorage.getItem(WALLET_NAME)) {
        try {
          connecting.value = true;
          await walletCore.connect(window.localStorage.getItem(WALLET_NAME) as string);
          address.value = walletCore.account?.address;
        } catch (e: any) {
          console.log(e);
        } finally {
          connecting.value = false;
        }
      } else {
        connecting.value = false;
      }
    }, 1000);
  }

  // ============ fetch balance ============
  // 获取账户余额
  const fetchBalance = async () => {
    if (address.value) {
      try {
        balance.value = await AptosClient.getAccountCoinAmount({
          accountAddress: address.value as HexInput,
          coinType: '0x1::aptos_coin::AptosCoin',
        });
      } catch (error) {
        balance.value = 0;
      }
    } else {
      balance.value = 0;
    }
  };

  return { address, balance, walletCore };
});

export default useAppStore;

