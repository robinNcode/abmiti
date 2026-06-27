export const Routes = {
    Splash: 'Splash',
    AuthRoot: 'AuthRoot',
    MainRoot: 'MainRoot',
    Login: 'Login',
    Register: 'Register',
    Home: 'Home',
    Profile: 'Profile',
} as const;

export type RootStackParamList = {
    Splash: undefined;
    AuthRoot: undefined;
    MainRoot: undefined;
    Login: undefined;
    Register: undefined;
    Home: undefined;
    Profile: undefined;
};
