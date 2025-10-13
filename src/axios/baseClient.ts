import AxiosClient from '.';
import { getBaseUrl, getBaseZapUrl } from '../config';

export const baseApiClient = AxiosClient.getInstance(getBaseUrl());

export const baseZapApiClient = AxiosClient.getInstance(getBaseZapUrl());
