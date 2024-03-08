import { message } from 'ant-design-vue';
import BigNumber from 'bignumber.js';
import dayjs from 'dayjs';
import numeral from 'numeral';

export const ShortAddress = (address: string) => {
  return address && address !== '0' ? address.replace(/(^\S{4})(\S*)(\S{4})$/, '$1...$3') : '';
};

export const copy = (text: string) => {
  window.navigator.clipboard.writeText(text);
  message.success('Copied');
};

export const DateFormat = (date: string | number) => {
  if (!date) return '-';
  return dayjs(date).format('YYYY-MM-DD HH:mm:ss');
};

export const PercentFormat = (
  molecule: number | 'string' | BigNumber = 0,
  denominator: number | 'string' | BigNumber = 1,
) => {
  return new BigNumber(molecule).div(denominator).times(100).dp(2);
};

export const NumberFormat = (num: number | 'string' | BigNumber = 0) => {
  return new BigNumber(num).toFormat();
};

export const sleep = (ms: number) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const NumeralFormat = (num: number | string) => {
  return numeral(num).format('0.[0]a');
};

