// CJS shim for uuid v14 (pure-ESM) so Jest can load @solana/web3.js.
// Only v4 is needed by rpc-websockets (request ID generation).
/* eslint-env node */
/* eslint-disable @typescript-eslint/no-var-requires */
const { randomUUID } = require('crypto');
module.exports = { v4: () => randomUUID() };
