import AxiosClient from '.';
import { config } from '../config';

export const baseApiClient = AxiosClient.getInstance(config.getBaseUrl());

export const baseZapApiClient = AxiosClient.getInstance(config.getBaseZapUrl());
