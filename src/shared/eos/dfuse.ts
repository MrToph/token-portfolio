import {
  createDfuseClient,
  SearchTransactionRow,
  ActionTrace,
  DfuseClient,
} from "@dfuse/client";
import { TEosAction } from "@deltalabs/eos-utils";
import { TActionTraceMatcher, TActionInfo } from "types/dfuse";

export interface SingleTableScopeResult<T> {
  last_irreversible_block_id: string;
  last_irreversible_block_num: number;
  rows: TableScopeRowResult<T>[];
}

export interface TableScopesResult<T> {
  last_irreversible_block_id: string;
  last_irreversible_block_num: number;
  tables: TableScopeResult<T>[];
}

export interface TableScopeResult<T> {
  account: string;
  scope: string;
  rows: TableScopeRowResult<T>[];
}

export interface TableScopeRowResult<T> {
  key: string;
  payer: string;
  json: T;
}

export interface TableScopes {
  block_num: number;
  scopes: string[];
}

let DFUSE_API_KEY = localStorage.getItem(`DFUSE_API_KEY`);

if (!DFUSE_API_KEY) {
  let apiKey = ``;
  do {
    apiKey = prompt(`Must provide a dfuse.io API key`, `Title`) || ``;
  } while (!apiKey);
  localStorage.setItem(`DFUSE_API_KEY`, apiKey);
  DFUSE_API_KEY = apiKey;
}

const client = createDfuseClient({
  apiKey: DFUSE_API_KEY,
  network: `mainnet`,
});

export async function getTableScopes(
  code: string,
  table: string,
  block_num: number
) {
  try {
    const response = await client.stateTableScopes(code, table, {
      blockNum: block_num,
    });
    return (response as unknown) as TableScopes;
  } catch (e) {
    throw e;
  }
}

export async function getTablesByScopes<T>(
  code: string,
  table: string,
  scopes: string[],
  block_num?: number
): Promise<TableScopesResult<T>> {
  try {
    const response = await client.stateTablesForScopes<T>(code, scopes, table, {
      blockNum: block_num,
    });
    return (response as unknown) as TableScopesResult<T>;
  } catch (e) {
    throw e;
  }
}

const getActionTraces = (
  tx: SearchTransactionRow,
  isMatchingTrace: TActionTraceMatcher
): TActionInfo[] => {
  const matchingTraces = new Array<ActionTrace<any>>();

  // BFS through transaction traces
  const traces = tx.lifecycle.execution_trace!.action_traces;
  while (traces.length > 0) {
    const curTrace = traces.shift()!;

    if (isMatchingTrace(curTrace)) {
      matchingTraces.push(curTrace);
    }

    if (Array.isArray(curTrace.inline_traces)) {
      traces.push(...curTrace.inline_traces);
    }
  }

  return matchingTraces.map((trace) => {
    return {
      blockNumber: trace.block_num,
      timestamp: new Date(`${trace.block_time}Z`),
      account: trace.act.account,
      name: trace.act.name,
      data: trace.act.data,
      print: trace.console,
      trxId: trace.trx_id,
      // https://github.com/EOSIO/eos/blob/master/libraries/chain/apply_context.cpp#L127
      // global_sequence unique per non-failed transactions
      globalSequence: Number.parseInt(
        String(trace.receipt.global_sequence),
        10
      ),
      // recv_sequence unique per contract, is a counter incremeted each time account is a receiver
      receiveSequence: Number.parseInt(String(trace.receipt.recv_sequence), 10),
      // not necessarily unique as it just hashes the action data?
      actDigest: trace.receipt.act_digest,
    };
  });
};

type DfuseSearchTransactionOptions = {
  toBlock?: number;
  limit: number;
};
const defaultSearchOptions: DfuseSearchTransactionOptions = {
  toBlock: undefined,
  limit: 100,
};
export async function* searchTransactions(
  searchQuery: string,
  actionTraceMatcher: TActionTraceMatcher,
  options: DfuseSearchTransactionOptions = defaultSearchOptions
): AsyncIterableIterator<ReturnType<typeof getActionTraces>> {
  options = { ...defaultSearchOptions, ...options };
  let response: any;
  let cursor = ``;

  do {
    try {
      // sometimes dfuse searchTransaction gets stuck on mainnet and takes ages or never returns
      response = await Promise.race([
        new Promise((res, rej) => {
          setTimeout(() => {
            rej(new Error(`searchTransactions took too long.`));
          }, 20 * 1e3);
        }),
        client.searchTransactions(searchQuery, {
          limit: options.limit,
          sort: `desc`,
          cursor,
          startBlock: options.toBlock,
        }),
      ]);
    } catch (error) {
      let message = error.message;
      if (error.details && error.details.errors)
        message = `${message}. ${JSON.stringify(error.details.errors)}`;

      console.error(`dfuse: ${message}`);
      // try again
      continue;
    }

    cursor = response.cursor;

    const newTransactions = response.transactions;
    if (newTransactions && newTransactions[0]) {
      const newActions = [] as ReturnType<typeof getActionTraces>;
      newTransactions.forEach((trans) => {
        const actions = getActionTraces(trans, actionTraceMatcher);
        newActions.push(...actions);
      });
      yield newActions;
    }
  } while (cursor !== ``);
}

export const dfuseClient = client;