import React from 'react';
import TokenStore from './token';
import UserStore from 'modules/user/store';

export default class RootStore {
    tokenStore = new TokenStore(this);
    userStore = new UserStore(this);

    async init() {
        // wait until user store is initialized before initializing other stores
        await this.userStore.init();
        await this.tokenStore.init();
    }
}

export const rootStore = new RootStore();
export const storeContext = React.createContext<RootStore>(rootStore);
