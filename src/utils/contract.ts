import { Services } from 'src/constants';
import { Versions } from 'src/enums';

export const CURRENT_VERSION = {
  [Services.swap]: Versions.V2,
  [Services.bridge]: Versions.V2,
  [Services.dca]: Versions.V1,
  [Services.zap]: Versions.V1,
};
