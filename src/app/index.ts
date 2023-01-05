import { applyMixins } from "./../utils";
import { Endpoints } from "./api/Endpoints";
import { Base } from "./Base";
import { Contract } from "./contract/Contract";

class DZap extends Base {}
interface DZap extends Endpoints {}
interface DZap extends Contract {}

applyMixins(DZap, [Endpoints, Contract]);

export default DZap;
