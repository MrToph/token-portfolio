import React from 'react';
import { observable } from "mobx";
import TokenStore from './token';
import UserStore from 'modules/user/store';

export default class RootStore {
    @observable initialized = false;
    tokenStore = new TokenStore(this);
    userStore = new UserStore(this);

    async init() {
        // wait until user store is initialized before initializing other stores
        await this.userStore.init();
        this.initialized = true;
    }

    public onNewAccount = async () => {
        try {
            await this.tokenStore.fetchTokenInfo()
        } catch (error) {
            console.error(`Error fetching token info:`, error.message)
        }
    }
}

export const rootStore = new RootStore();
export const storeContext = React.createContext<RootStore>(rootStore);
