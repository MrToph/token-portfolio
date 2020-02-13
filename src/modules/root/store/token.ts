import { decomposeAsset, formatAsset, TAsset } from "@deltalabs/eos-utils";
import BigNumber from "bignumber.js";
import { action, observable } from "mobx";
import RootStore from "modules/root/store";
import { getTablesByScopes, searchTransactions } from "shared/eos/dfuse";
import { TAccountsRow } from "types/tables";
import { ActionTrace } from "@dfuse/client";
import { TActionTraceMatcher, TActionInfo } from "types/dfuse";

const EOS_SYMBOL = {
  precision: 4,
  code: `EOS`
};
export default class TokenStore {
  rootStore: RootStore;
  @observable balance?: TAsset = undefined;
  transferActions = observable.array<TActionInfo>([]);

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  @action public fetchTokenInfo = async () => {
    const {
      balance,
      lastIrreversibleBlockNum: blockNum
    } = await this._fetchCurrentBalance();
    this.balance = balance;

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
      this.transferActions.push(...traces)
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
}
