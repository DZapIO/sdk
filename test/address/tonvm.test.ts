/**
 * Offline tests for TON address validation.
 * Expected values were recorded from tonweb@0.0.66 `Address.isValid`, which this implementation replaces.
 */
import { isValidTonAddress } from '../../src/utils/address/tonvm';

const HEX = 'ab'.repeat(32);

const tonwebVectors: Array<[string, boolean]> = [
  // Live mainnet addresses and their alternate encodings
  ['EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt', true],
  ['0:6c1b1f40ac00d4ad1101df85be82182c0a005286f7d4af826f96efb4286737dd', true],
  ['UQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Uso', true],
  ['EQBsGx9ArADUrREB34W+ghgsCgBShvfUr4Jvlu+0KGc33Rbt', true],
  ['kQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33a1n', true],
  ['0QBsGx9ArADUrREB34W+ghgsCgBShvfUr4Jvlu+0KGc33fCi', true],
  ['EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33RbA', false],
  ['QBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33Rbt', false],
  ['EQBsGx9ArADUrREB34W-ghgsCgBShvfUr4Jvlu-0KGc33RbtA', false],
  ['eqbsgx9aradurreb34w-ghgscgbshvfur4jvlu-0kgc33rbt', false],
  ['EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', true],
  ['0:b113a994b5024a16719f69139328eb759596c38a25f59028b146fecdc3621dfe', true],
  ['UQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_p0p', true],
  ['EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id/sDs', true],
  ['kQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_ntm', true],
  ['0QCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id/iaj', true],
  ['EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDA', false],
  ['EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtG', true],
  ['0:348bcf827469c5fc38541c77fdd91d4e347eac200f6f2d9fd62dc08885f0415f', true],
  ['EQA0i8+CdGnF/DhUHHf92R1ONH6sIA9vLZ/WLcCIhfBBXwtG', true],
  ['EQA0i8-CdGnF_DhUHHf92R1ONH6sIA9vLZ_WLcCIhfBBXwtA', false],
  // Masterchain (workchain -1)
  ['-1:3333333333333333333333333333333333333333333333333333333333333333', true],
  ['Ef8zMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzMzM0vF', true],
  // Raw form edge cases, including tonweb's radix-less workchain parsing
  [`1:${HEX}`, false],
  [`0:${HEX.slice(2)}`, false],
  [`0:${HEX.toUpperCase()}`, true],
  [`0:${HEX}:x`, false],
  [` 0:${HEX}`, true],
  [`0x0:${HEX}`, true],
  [`0x1:${HEX}`, false],
  [`-0x1:${HEX}`, true],
  [`-1-:${HEX}`, true],
  [`-1_:${HEX}`, false],
  [`00:${HEX}`, true],
  [`+0:${HEX}`, true],
  [`0:${HEX.slice(0, 63)}g`, false],
  [`:${HEX}`, false],
  [`abc:${HEX}`, false],
  [`-1:${HEX}`, true],
  ['', false],
  [' ', false],
  ['hello', false],
  // Valid checksums with every tag / workchain combination
  ['EQBFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwAw6', true],
  ['EQBFao-02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwAw6', true],
  ['UQBFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwFH/', true],
  ['UQBFao-02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwFH_', true],
  ['kQBFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwLew', true],
  ['0f9Fao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwBU9', true],
  ['IgBFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwE3/', false],
  ['EQFFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwIHm', false],
  ['EX9Fao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwDVw', false],
  ['gABFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwHjs', false],
  // Malformed base64
  ['EQBFao+02f4jSG2St9wB ktwlbrfBClOc5i94gcsUXabwAw6', false],
  ['EQBFao+02f4jSG2St9wBJktwlbrfBClOc5i94gcsUXabwAw=', false],
  ['EQBFao+02f=jSG2St9wBJktwlbrfBClOc5i94gcsUXabwAw6', false],
];

describe('isValidTonAddress', () => {
  it.each(tonwebVectors)('%s → %s', (address, expected) => {
    expect(isValidTonAddress(address)).toBe(expected);
  });
});
