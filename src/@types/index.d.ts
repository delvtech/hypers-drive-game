import { BodyCompOpt } from "kaboom";

interface PatchedBodyCompOpt extends BodyCompOpt {
  isSolid?: boolean;
}

// interface NewKaboomCtx extends KaboomCtx {
//   body(options?: NewBodyCompOpt): BodyComp;
// }

// declare module "kaboom" {
//   const BodyCompOpt: NewBodyCompOpt;
//   const KaboomCtx: NewKaboomCtx;
// }
