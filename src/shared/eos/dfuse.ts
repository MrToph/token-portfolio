import {
  createDfuseClient
} from "@dfuse/client";

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

const client = createDfuseClient({
  authentication: false,
  network: `eos.dfuse.eosnation.io`,
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


export const dfuseClient = client;
