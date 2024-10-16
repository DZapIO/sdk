import { getBaseUrl } from 'src/config';
import AxiosClient from '.';

export const baseApiClient = AxiosClient.getInstance(getBaseUrl());
