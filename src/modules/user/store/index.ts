import { action, computed, observable } from "mobx";
import RootStore from "modules/root/store";
import { getLocalStorage, setLocalStorage } from "shared/local-storage";

export default class AccountStore {
  rootStore: RootStore;
  @observable public accountName = ``;
  @observable public networkName = `mainnet`;

  constructor(rootStore: RootStore) {
    this.rootStore = rootStore;
  }

  @action handleUserNameSubmit = (userName: string) => {
    this.accountName = userName;
    setLocalStorage(`accountName`, userName);
    this.rootStore.onNewAccount()
  };

  @action init = async () => {
    this.accountName = getLocalStorage(`accountName`) || ``;
    if(this.accountName) {
      this.rootStore.onNewAccount()
    }
  };
}
