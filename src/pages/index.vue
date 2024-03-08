<template>
  <div class="flex-col gap-10 text-5 font-semibold">
    <div class="flex-col gap-2">
      <span class="font-semibold text-6">Wallet List</span>
      <div
        class="flex items-center font-bold gap-2 text-6 cursor-pointer p-4 bg-primary/10 rounded-2 hover:bg-primary/20"
        v-for="wallet in wallets"
        :key="wallet.name"
        @click="walletCore.connect(wallet.name)"
      >
        <img :src="wallet.icon" class="w-10 aspect-1 rounded-2" />
        <span>{{ wallet.name }}</span>
        <span class="ml-auto">
          {{ walletCore.wallet?.name === wallet.name ? 'Connected' : wallet.readyState }}
        </span>
      </div>
    </div>

    <div class="flex-col gap-2">
      <span>Address: {{ address }}</span>
      <span>Balance: {{ BigNumber(balance).shiftedBy(-8) }} APT</span>
      <span>Current Wallet: {{ walletCore.wallet?.name }}</span>
      <button @click="disconnectHandler" v-if="address">Disconnect</button>
    </div>

    <div class="flex-col gap-2">
      <input v-model="targetAddress" />
      <button @click="transferHanlder" :disabled="transferring || !address">
        <font-awesome-icon
          icon="fa-solid fa-spinner"
          class="animate-spin mr-1"
          v-if="transferring"
        />
        Transfer
      </button>
    </div>

    <div class="flex-col gap-2">
      <input v-model="messageStr" />
      <button @click="signMessageHandler" :disabled="signing || !address">
        <font-awesome-icon icon="fa-solid fa-spinner" class="animate-spin mr-1" v-if="signing" />
        Sign Message
      </button>
      <div class="text-base whitespace-pre" v-if="signatureResult.address">
        {{ signatureResult }}
        <div>
          <span>PublicKey:</span>
          {{ walletCore.account?.publicKey }}
        </div>
      </div>
    </div>

    <div class="flex-col gap-2">
      <button @click="viewTokenHandler" :disabled="!address">View APT Decimal and Name</button>
      <div class="flex-col gap-2" v-if="APT_INFO.name">
        <span>Name: {{ APT_INFO.name }}</span>
        <span>Decimal: {{ APT_INFO.decimals }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { AptosClient, wallets } from '@/config';
  import { HexInput } from '@aptos-labs/ts-sdk';
  import { InputTransactionData, WalletCore } from '@aptos-labs/wallet-adapter-core';
  import { message } from 'ant-design-vue';
  import BigNumber from 'bignumber.js';

  const targetAddress = ref('');

  const disconnectHandler = () => {
    walletCore.disconnect();
    targetAddress.value = '';
  };

  const WALLET_NAME = 'AptosWalletName';
  const APTOS_COIN = '0x1::aptos_coin::AptosCoin';

  const address = ref();
  const balance = ref(0);
  const walletCore = new WalletCore(wallets);

  const autoConnect = ref(true);
  const connecting = ref(false);

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

  // ============ fetch balance ============
  // 获取账户余额
  const fetchBalance = async () => {
    if (address.value) {
      try {
        balance.value = await AptosClient.getAccountCoinAmount({
          accountAddress: address.value as HexInput,
          coinType: APTOS_COIN,
        });
        console.log('balance:', balance.value);
      } catch (error) {
        balance.value = 0;
      }
    } else {
      balance.value = 0;
    }
  };

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

  // ============ transfer ============
  const transferring = ref(false);
  const transferHanlder = async () => {
    if (transferring.value) return;

    const transaction: InputTransactionData = {
      data: {
        // 'ContractAdrres::ModuleName::FunctionName'
        // https://aptos.dev/reference/move/?branch=mainnet&page=aptos-framework/doc/aptos_account.md#0x1_aptos_account_transfer
        function: '0x1::aptos_account::transfer_coins',
        typeArguments: [APTOS_COIN],
        functionArguments: [targetAddress.value, 1],
      },
    };

    try {
      transferring.value = true;
      const response = await walletCore.signAndSubmitTransaction(transaction);
      console.log('Transfer Transaction Response: ', response);

      await AptosClient.waitForTransaction({
        transactionHash: response.hash,
      });

      message.success(
        `交易成功 : https://explorer.aptoslabs.com/txn/${response.hash}?network=testnet`,
      );
    } catch (error) {
      console.error(error);
    } finally {
      transferring.value = false;
    }
  };

  // ============ Sign Message ============
  const messageStr = ref('');
  const signing = ref(false);
  const signatureResult = ref<any>({});
  const signMessageHandler = async () => {
    if (signing.value) return;

    try {
      signing.value = true;
      const signature = await walletCore.signMessage({
        // message: messageStr.value,
        message: `${messageStr.value} \nnew line`,
        nonce: Math.ceil(1e10 * Math.random()).toString(),
      });
      signatureResult.value = signature;
    } catch (error) {
      console.error(error);
    } finally {
      signing.value = false;
    }
  };

  // ============ View function ============
  // https://aptos.dev/reference/move/?branch=mainnet&page=aptos-framework/doc/code.md
  const APT_INFO = ref({
    name: '',
    decimals: 0,
  });
  const viewTokenHandler = async () => {
    APT_INFO.value.name = (
      await AptosClient.view<string[]>({
        payload: {
          function: '0x1::coin::name',
          typeArguments: [APTOS_COIN],
        },
      })
    )?.[0];

    APT_INFO.value.decimals = (
      await AptosClient.view<number[]>({
        payload: {
          function: '0x1::coin::decimals',
          typeArguments: [APTOS_COIN],
        },
      })
    )?.[0];
  };

  watch(
    () => address.value,
    () => {
      if (address.value) {
        targetAddress.value = address.value;
      }
    },
    {
      immediate: true,
    },
  );
</script>

<route lang="yaml">
meta:
  layout: default
</route>

