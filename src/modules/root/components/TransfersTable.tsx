import { observer } from "mobx-react";
import React from "react";
import { useStore } from "shared/hooks";
import {
  formatAsset,
  formatBlockExplorerTransaction
} from "@deltalabs/eos-utils";
import { List, ListItem, ListIcon } from "@chakra-ui/core";

const TransfersTable: React.FC = () => {
  const [userStore, tokenStore] = useStore(rootStore => [
    rootStore.userStore,
    rootStore.tokenStore
  ]);

  return (
    <>
      <h1>{userStore.accountName}</h1>
      <h2>{tokenStore.balance ? formatAsset(tokenStore.balance) : `NaN`}</h2>
      <List spacing={3}>
        {tokenStore.transferActions.map(action => (
          <ListItem key={action.globalSequence}>
            <ListIcon icon="check-circle" color="teal.500" />
            <a href={formatBlockExplorerTransaction(`bloks`)(action.trxId)}>
              <code>{action.trxId.slice(0, 16)}...</code>
            </a>
            <span>{` `}{action.data.quantity}</span>
          </ListItem>
        ))}
      </List>
    </>
  );
};

export default observer(TransfersTable);
