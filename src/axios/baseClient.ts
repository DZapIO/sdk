import { config } from '../config';
import AxiosClient from '.';

export const baseApiClient = AxiosClient.getInstance(config.getBaseUrl());

export const baseZapApiClient = AxiosClient.getInstance(config.getBaseZapUrl());
