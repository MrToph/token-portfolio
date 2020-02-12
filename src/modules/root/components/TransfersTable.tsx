import { observer } from "mobx-react";
import React from "react";
import { useStore } from "shared/hooks";

const TransfersTable: React.FC = () => {
  const [userStore, tokenStore] = useStore(rootStore => [
    rootStore.userStore,
    rootStore.tokenStore
  ]);

  return <h1>{userStore.accountName}</h1>;
};

export default observer(TransfersTable);
