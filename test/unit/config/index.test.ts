import { AppEnv } from '../../../src/enums';
import { createConfig, config } from '../../../src/config';

describe('config/index', () => {
  describe('createConfig', () => {
    it('returns default values when env overrides are absent', () => {
      const cfg = createConfig();

      expect(cfg.getBaseApiUrl()).toBe('https://api.dzap.io');
      expect(cfg.getZapApiUrl()).toBe('https://zap.dzap.io');
      expect(cfg.getVersionPostfix()).toBe('v1/');
      expect(cfg.getEip2612DisabledChains()).toEqual([747474]);
      expect(cfg.getRpcUrlsByChainId(42161)).toBeUndefined();
    });

    it('builds base urls from api url and version postfix', () => {
      const cfg = createConfig();

      cfg.setBaseApiUrl('https://api.example.com');
      cfg.setZapApiUrl('https://zap.example.com');
      cfg.setVersionPostfix('v2/');

      expect(cfg.getBaseUrl()).toBe('https://api.example.com/v2/');
      expect(cfg.getBaseZapUrl()).toBe('https://zap.example.com/v2/');
    });

    it('updates api key via setter', () => {
      const cfg = createConfig();

      cfg.setApiKey('test-api-key');
      expect(cfg.getApiKey()).toBe('test-api-key');
    });

    it('updates rpc urls by chain id', () => {
      const cfg = createConfig();
      const rpcUrls = { 42161: ['https://arb.example.com'] };

      cfg.setRpcUrlsByChainId(rpcUrls);
      expect(cfg.getRpcUrlsByChainId(42161)).toEqual(['https://arb.example.com']);
    });

    it('updates eip2612 disabled chains', () => {
      const cfg = createConfig();

      cfg.setEip2612DisabledChains([1, 42161]);
      expect(cfg.getEip2612DisabledChains()).toEqual([1, 42161]);
    });

    it('updates app env', () => {
      const cfg = createConfig();

      cfg.setAppEnv(AppEnv.production);
      expect(cfg.getAppEnv()).toBe(AppEnv.production);
    });

    it('creates isolated config instances', () => {
      const first = createConfig();
      const second = createConfig();

      first.setApiKey('first-key');
      second.setApiKey('second-key');

      expect(first.getApiKey()).toBe('first-key');
      expect(second.getApiKey()).toBe('second-key');
    });
  });

  describe('environment initialization', () => {
    const originalEnv = process.env;

    afterEach(() => {
      process.env = originalEnv;
      jest.resetModules();
    });

    it('reads api key from DZAP_API_KEY', async () => {
      process.env = { ...originalEnv, DZAP_API_KEY: 'env-api-key' };
      jest.resetModules();

      const { createConfig: createConfigFromEnv } = await import('../../../src/config');
      expect(createConfigFromEnv().getApiKey()).toBe('env-api-key');
    });

    it('prefers REACT_APP env vars over fallbacks', async () => {
      process.env = {
        ...originalEnv,
        REACT_APP_ENV: AppEnv.production,
        REACT_APP_BASE_API_URL: 'https://react-api.example.com',
        REACT_APP_ZAP_API_URL: 'https://react-zap.example.com',
        REACT_APP_DZAP_API_KEY: 'react-api-key',
        DZAP_API_KEY: 'fallback-api-key',
        BASE_API_URL: 'https://fallback-api.example.com',
      };
      jest.resetModules();

      const { createConfig: createConfigFromEnv } = await import('../../../src/config');
      const cfg = createConfigFromEnv();

      expect(cfg.getApiKey()).toBe('react-api-key');
      expect(cfg.getAppEnv()).toBe(AppEnv.production);
      expect(cfg.getBaseApiUrl()).toBe('https://react-api.example.com');
      expect(cfg.getZapApiUrl()).toBe('https://react-zap.example.com');
    });

    it('reads NEXT_PUBLIC env vars when REACT_APP vars are absent', async () => {
      process.env = {
        ...originalEnv,
        NEXT_PUBLIC_APP_ENV: AppEnv.production,
        NEXT_PUBLIC_BASE_API_URL: 'https://next-api.example.com',
        NEXT_PUBLIC_ZAP_API_URL: 'https://next-zap.example.com',
        NEXT_PUBLIC_DZAP_API_KEY: 'next-api-key',
      };
      jest.resetModules();

      const { createConfig: createConfigFromEnv } = await import('../../../src/config');
      const cfg = createConfigFromEnv();

      expect(cfg.getApiKey()).toBe('next-api-key');
      expect(cfg.getAppEnv()).toBe(AppEnv.production);
      expect(cfg.getBaseApiUrl()).toBe('https://next-api.example.com');
      expect(cfg.getZapApiUrl()).toBe('https://next-zap.example.com');
    });
  });

  describe('config singleton', () => {
    it('exports a shared config instance', () => {
      expect(config.getBaseApiUrl()).toBeTruthy();
      expect(typeof config.setApiKey).toBe('function');
      expect(typeof config.getBaseUrl).toBe('function');
    });
  });
});
