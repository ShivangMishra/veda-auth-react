import React, {useState, useEffect, ReactNode, useRef} from 'react';
import AuthClient from './AuthClient.ts';
import {hasAuthParams} from "./utils.ts";
import AuthContext from './AuthContext.tsx';

interface User {
   // TODO: Define user type
}

export interface AuthContextType {
    user: User | null;
    loading: boolean;
}

interface AuthProviderProps {
    children: ReactNode;
    clientId: string;
    redirectUri: string;
    clientSecret: string;
    vedaAuthBaseUrl: string;
    onRedirectCallback?: (user: User) => void;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
                                                              children,
                                                              onRedirectCallback,
                                                              clientId,
                                                              redirectUri,
                                                              clientSecret,
                                                              vedaAuthBaseUrl
                                                          }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const initialized = useRef(false);

    const [authClient] = useState(new AuthClient({
        clientId, clientSecret, redirectUri, vedaAuthBaseUrl
    }));

    useEffect(() => {
        if (user && loading) {
            setLoading(false);
        }
    }, [user, loading]);

    useEffect(() => {
        (async () => {
            if (initialized.current) {
                return;
            }
            initialized.current = true;
            if (hasAuthParams()) {
                setLoading(true);
                await authClient.handleRedirect();
                const userInfo = await authClient.fetchUserInfo();
                setUser(userInfo);
                if (onRedirectCallback) {
                    onRedirectCallback(userInfo);
                }
            } else {
                await authClient.fetchAuthorizationEndpoint();
            }
        })();
    }, [authClient, onRedirectCallback]);

    const contextValue = {
        user,
        loading,
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};
