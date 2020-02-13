import { ActionTrace } from "@dfuse/client";

export type TActionTraceMatcher<T = any> = (actionTrace: ActionTrace<T>) => boolean;

export type TActionInfo<T = any> = {
  blockNumber: number;
  timestamp: Date;
  account: string;
  name: string;
  data: T;
  print: string;
  trxId: string;
  globalSequence: number;
  receiveSequence: number;
  actDigest: string;
};