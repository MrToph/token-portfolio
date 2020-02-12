import { action, computed, observable } from "mobx";
import RootStore from "modules/root/store";
import { getLocalStorage, setLocalStorage } from "shared/local-storage";

export default class AccountStore {
  rootStore: RootStore;
  @observable public accountName = ``;
  @observable public networkName = `mainnet`;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
    this.accountName = getLocalStorage(`accountName`) || ``;
  }

  @action handleUserNameSubmit = (userName: string) => {
    this.accountName = userName;
    setLocalStorage(`accountName`, userName);
  };

  @action init = () => {
  };
}
