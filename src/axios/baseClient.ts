import { getBaseUrl, getBaseZapUrl } from 'src/config';
import AxiosClient from '.';

export const baseApiClient = AxiosClient.getInstance(getBaseUrl());

export const baseZapApiClient = AxiosClient.getInstance(getBaseZapUrl());
