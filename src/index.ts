import { Endpoints } from "./app/api/Endpoints";
import { Base } from "./app/Base";
import { Contract } from "./app/contract/Contract";
import { applyMixins } from "./utils/index";

class DZap extends Base {}
interface DZap extends Endpoints {}
interface DZap extends Contract {}

applyMixins(DZap, [Endpoints, Contract]);

export default DZap;
