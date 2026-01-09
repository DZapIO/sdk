import AxiosClient from '.';
import { Config } from '../config';

function getBaseTradeUrl() {
  const config = Config.getInstance();
  return `${config.baseApiUrl}/${config.versionPostfix}`;
}

function getBaseZapUrl() {
  const config = Config.getInstance();
  return `${config.zapApiUrl}/${config.versionPostfix}`;
}

export const tradeApiClient = AxiosClient.getInstance(getBaseTradeUrl());

export const zapApiClient = AxiosClient.getInstance(getBaseZapUrl());
