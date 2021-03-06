import {
  decomposeAsset,
  DfuseSearcher,
  formatAsset,
  TActionInfo,
  TAsset,
} from "@deltalabs/eos-utils";
import BigNumber from "bignumber.js";
import { action, observable, computed } from "mobx";
import RootStore from "modules/root/store";
import { dfuseClient, getTablesByScopes } from "shared/eos/dfuse";
import { TAccountsRow } from "types/tables";
import groupBy from "lodash/groupBy";
import { computeHistogram } from "../logic";
import { setLocalStorage, getLocalStorage } from "shared/local-storage";

const EOS_SYMBOL = {
  precision: 4,
  code: `EOS`,
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
  @observable minBalanceFilter: string;
  @observable public isFetching = false;
  private shouldCancelFetching = false;
  @observable private transferActions = observable.array<
    TActionInfo<TTransferData>
  >([]);

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.minBalanceFilter = getLocalStorage(`minBalanceFilter`) || `0.01`;
  }

  @action handleMinBalanceFilterSubmit = (minBalanceFilter: string) => {
    this.minBalanceFilter = minBalanceFilter;
    setLocalStorage(`minBalanceFilter`, minBalanceFilter);
  };

  @computed private get minBalance() {
    let amount = 0;
    const symbol = this.balance!.symbol;
    if (this.minBalanceFilter) {
      const precisionAdjustment = Math.pow(10, symbol.precision);
      amount = Math.floor(
        Number.parseFloat(this.minBalanceFilter) * precisionAdjustment
      );
    }
    return { amount, symbol };
  }

  public cancelFetching = async () => {
    this.shouldCancelFetching = true;
  };

  @action public fetchTokenInfo = async () => {
    const {
      balance,
      lastIrreversibleBlockNum: blockNum,
    } = await this._fetchCurrentBalance();
    this.balance = balance;
    this.transferActions.replace([]);

    try {
      this.shouldCancelFetching = false;
      this.isFetching = true;
      await this._fetchTransactions(blockNum);
    } catch (error) {
      console.error(error.message);
    } finally {
      this.isFetching = false;
    }
  };

  @action private _fetchTransactions = async (toBlock) => {
    const accountName = this._checkAccount();

    const searcher = new DfuseSearcher({ client: dfuseClient });

    const actionTraceMatcher: Parameters<
      typeof searcher["searchTransactions"]
    >[1] = (trace) => {
      return true;
    };
    const searchString = `receiver:${accountName} account:eosio.token action:transfer`;

    for await (const traces of searcher.searchTransactions<any>(
      searchString,
      actionTraceMatcher,
      {
        limit: 100,
        backward: true,
      }
    )) {
      // stop fetching transfers for other account if we changed it
      if (this.shouldCancelFetching) break;
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
      lastIrreversibleBlockNum,
    };
  };

  private _getAccount(): string {
    return this.rootStore.userStore.accountName;
  }

  private _checkAccount(): string {
    const accountName = this._getAccount();
    if (!accountName) throw new Error(`Must enter an account name first`);
    return accountName;
  }

  @computed public get groupedTransfers(): TGroupedTransfers {
    const accountName = this._getAccount();
    if (!accountName || !this.balance) return {};

    let runningAmount = this.balance.amount;
    const symbol = this.balance.symbol;

    const result: TGroupedTransfers = {};
    const sortedAction = this.transferActions.sort(
      (a1, a2) => a2.blockNumber - a1.blockNumber
    );
    const groupedActions = groupBy(sortedAction, (action) => action.txId);
    Object.entries(groupedActions).forEach(([trxId, actions], index) => {
      let sumAmount = new BigNumber(`0`);
      let biggestParty = ``;
      let biggestPartyAmount = new BigNumber(`0`);
      actions.forEach((action) => {
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

      // filter results by minBalance
      // always show latest transfer such that the correct current balance is displayed
      const isLatestTransfer = index === 0;
      if (
        isLatestTransfer ||
        sumAmount.abs().isGreaterThanOrEqualTo(this.minBalance.amount)
      ) {
        const [action] = actions;
        result[trxId] = {
          trxId: action.txId,
          blockNumber: action.blockNumber,
          timestamp: action.timestamp,
          deltaQuantity: { amount: sumAmount, symbol },
          balance: { amount: runningAmount, symbol },
          impact: 0,
          party: biggestParty,
        };
      }
      runningAmount = runningAmount.minus(sumAmount);
    });

    const transactions = Object.values(result);
    const histogram = computeHistogram(
      transactions.map((trx, index) => ({
        index,
        val: trx.deltaQuantity.amount.toNumber(),
      }))
    );

    histogram.forEach((d) => {
      transactions[d.index].impact = d.bucket;
    });

    return result;
  }

  @computed public get groupedTransfersDataPoints() {
    if (!this.balance) return [];

    const precisionAdjustment = Math.pow(10, this.balance!.symbol.precision);
    return Object.values(this.groupedTransfers).map((trx) => ({
      x: trx.timestamp,
      y: trx.balance.amount.toNumber() / precisionAdjustment,
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
