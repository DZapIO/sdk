import AxiosClient from '.';
import { getConfig } from '../config';

function getBaseTradeUrl() {
  const config = getConfig();
  return `${config.baseApiUrl}/${config.versionPostfix}`;
}

function getBaseZapUrl() {
  const config = getConfig();
  return `${config.zapApiUrl}/${config.versionPostfix}`;
}

export const tradeApiClient = AxiosClient.getInstance(getBaseTradeUrl());

export const zapApiClient = AxiosClient.getInstance(getBaseZapUrl());
