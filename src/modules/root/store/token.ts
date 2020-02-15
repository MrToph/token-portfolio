import { decomposeAsset, formatAsset, TAsset } from "@deltalabs/eos-utils";
import BigNumber from "bignumber.js";
import { action, observable, computed } from "mobx";
import RootStore from "modules/root/store";
import { getTablesByScopes, searchTransactions } from "shared/eos/dfuse";
import { TAccountsRow } from "types/tables";
import groupBy from "lodash/groupBy";
import { TActionTraceMatcher, TActionInfo } from "types/dfuse";
import { computeHistogram } from "../logic";

const EOS_SYMBOL = {
  precision: 4,
  code: `EOS`
};
type TTransferData = {
  from: string;
  to: string;
  quantity: string;
  memo: string;
};
export type TGroupedTransfer = {
  trxId: string;
  blockNumber: number;
  timestamp: Date;
  deltaQuantity: TAsset;
  balance: TAsset;
  party: string; // other trading party
  impact: number; // value between [0, NUM_BUCKETS - 1] indicating the relative importance of deltaQuantity
};
type TGroupedTransfers = {
  [key: string]: TGroupedTransfer;
};
export default class TokenStore {
  rootStore: RootStore;
  @observable balance?: TAsset = undefined;
  @observable private transferActions = observable.array<
    TActionInfo<TTransferData>
  >([]);

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  @action public fetchTokenInfo = async () => {
    const {
      balance,
      lastIrreversibleBlockNum: blockNum
    } = await this._fetchCurrentBalance();
    this.balance = balance;
    this.transferActions.replace([]);

    this._fetchTransactions(blockNum);
  };

  @action private _fetchTransactions = async toBlock => {
    const accountName = this._checkAccount();
    const actionTraceMatcher: TActionTraceMatcher = trace => {
      if (trace.receipt.receiver !== accountName) return false;

      return (
        trace.act.account === `eosio.token` &&
        trace.act.name === `transfer` &&
        (trace.act.data.from === accountName ||
          trace.act.data.to === accountName)
      );
    };
    const args = [
      `receiver:${accountName} account:eosio.token action:transfer`,
      toBlock,
      actionTraceMatcher
    ];

    for await (const traces of searchTransactions(args[0], args[1], args[2])) {
      console.log(traces);
      this.transferActions.push(...traces);
    }
  };

  @action private _fetchCurrentBalance = async () => {
    this.balance = undefined;
    const accountName = this._checkAccount();

    const result = await getTablesByScopes<TAccountsRow>(
      `eosio.token`,
      `accounts`,
      [accountName]
    );
    const lastIrreversibleBlockNum = result.last_irreversible_block_num;
    const accountsRows = result.tables[0].rows;
    let balanceAmount = new BigNumber(`0`);
    if (accountsRows[0]) {
      balanceAmount = decomposeAsset(accountsRows[0].json.balance).amount;
    }
    return {
      balance: { amount: balanceAmount, symbol: EOS_SYMBOL },
      lastIrreversibleBlockNum
    };
  };

  private _checkAccount(): string {
    const accountName = this.rootStore.userStore.accountName;
    if (!accountName) throw new Error(`Must enter an account name first`);
    return accountName;
  }

  @computed public get groupedTransfers(): TGroupedTransfers {
    const accountName = this._checkAccount();

    if (!this.balance) return {};

    let runningAmount = this.balance.amount;
    const symbol = this.balance.symbol;

    const result: TGroupedTransfers = {};
    const sortedAction = this.transferActions.sort(
      (a1, a2) => a2.blockNumber - a1.blockNumber
    );
    const groupedActions = groupBy(sortedAction, action => action.trxId);
    Object.entries(groupedActions).forEach(([trxId, actions]) => {
      let sumAmount = new BigNumber(`0`);
      let biggestParty = ``;
      let biggestPartyAmount = new BigNumber(`0`);
      actions.forEach(action => {
        const isIncoming = action.data.to === accountName;
        const amount = decomposeAsset(action.data.quantity).amount;
        sumAmount = isIncoming
          ? sumAmount.plus(amount)
          : sumAmount.minus(amount);
        if (amount.abs().isGreaterThan(biggestPartyAmount)) {
          biggestPartyAmount = amount.abs();
          biggestParty = isIncoming ? action.data.from : action.data.to;
        }
      });

      const [action] = actions;
      result[trxId] = {
        trxId: action.trxId,
        blockNumber: action.blockNumber,
        timestamp: action.timestamp,
        deltaQuantity: { amount: sumAmount, symbol },
        balance: { amount: runningAmount, symbol },
        impact: 0,
        party: biggestParty
      };
      runningAmount = runningAmount.minus(sumAmount);
    });

    const transactions = Object.values(result);
    const histogram = computeHistogram(
      transactions.map((trx, index) => ({
        index,
        val: trx.deltaQuantity.amount.toNumber()
      }))
    );

    histogram.forEach(d => {
      transactions[d.index].impact = d.bucket;
    });

    return result;
  }

  @computed public get groupedTransfersDataPoints() {
    if (!this.balance) return [];

    const precisionAdjustment = Math.pow(10, this.balance!.symbol.precision);
    return Object.values(this.groupedTransfers).map(trx => ({
      x: trx.timestamp,
      y: trx.balance.amount.toNumber() / precisionAdjustment
    }));
  }

  @computed public get groupedTransfersDates() {
    const NUM_TICKS = 6;
    const dataPoints = this.groupedTransfersDataPoints;
    if (dataPoints.length < 2) return [];
    const end = dataPoints[0].x;
    const start = dataPoints[dataPoints.length - 1].x;
    const diff = end.getTime() - start.getTime();

    return Array.from(
      { length: NUM_TICKS + 1 },
      (_, index) =>
        new Date(start.getTime() + Math.floor(index * (diff / NUM_TICKS)))
    );
  }

  @computed public get chartRange() {
    const values = this.groupedTransfersDataPoints.map(({ y }) => y);
    return [Math.min(...values) * 0.5, Math.max(...values) * 1.05];
  }
}
