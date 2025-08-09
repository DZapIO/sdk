export type Witness = {
  value: number;
  script: string;
};

type PsbtInputP2PKH = {
  scriptType: 'p2pkh';
  nonWitnessUtxo: Buffer;
  redeemScript?: never;
};

type PsbtInputP2SH = {
  scriptType: 'p2sh';
  witnessUtxo: Witness;
  redeemScript: Buffer;
  redeemScriptArgumentByteLengths?: number[];
};

type PsbtInputP2WPKH = {
  scriptType: 'p2wpkh';
  witnessUtxo: Witness;
  redeemScript?: never;
};

type PsbtInputP2WSH = {
  scriptType: 'p2wsh';
  witnessUtxo: Witness;
  witnessScript: Buffer;
};

type PsbtInputP2TR = {
  scriptType: 'p2tr';
  witnessUtxo: Witness;
  tapInternalKey: Buffer;
};

export type PsbtInput = {
  hash: string;
  index: number;
  sequence: number;
  value: number;
} & (PsbtInputP2PKH | PsbtInputP2SH | PsbtInputP2WPKH | PsbtInputP2TR | PsbtInputP2WSH);

export type PsbtOutput = { address: string; script?: Buffer; value: number } | { script: string; value: number };
