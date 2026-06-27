export const Routes = {
    Splash: 'Splash',
    AuthRoot: 'AuthRoot',
    MainRoot: 'MainRoot',
    Login: 'Login',
    Register: 'Register',
    Home: 'Home',
    Dashboard: 'Dashboard',
    Entries: 'Entries',
    AddEntry: 'AddEntry',
    Analytics: 'Analytics',
    Categories: 'Categories',
    Accounts: 'Accounts',
    Profile: 'Profile',
} as const;

export type RootStackParamList = {
    Splash: undefined;
    AuthRoot: undefined;
    MainRoot: undefined;
    Login: undefined;
    Register: undefined;
    Home: undefined;
    Dashboard: undefined;
    Entries: undefined;
    AddEntry: { type?: import('../../models/common').EntryType } | undefined;
    Analytics: undefined;
    Categories: undefined;
    Accounts: undefined;
    Profile: undefined;
};
