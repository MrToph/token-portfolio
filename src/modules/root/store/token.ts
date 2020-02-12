import { action, computed, observable } from 'mobx';
import RootStore from 'modules/root/store';

export default class TokenStore {
    rootStore: RootStore;

    constructor(rootStore: RootStore) {
        this.rootStore = rootStore;
    }

    @action init = () => {
      // TODO: load token from LS
    };
}
