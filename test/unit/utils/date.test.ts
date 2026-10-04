import { generateDeadline } from '../../../src/utils/date';

describe('utils/date', () => {
  it('generateDeadline returns future timestamp', () => {
    const now = Math.floor(Date.now() / 1000);
    const deadline = generateDeadline(3600);
    expect(Number(deadline)).toBeGreaterThan(now);
    expect(Number(deadline)).toBeLessThanOrEqual(now + 3600);
  });
});
