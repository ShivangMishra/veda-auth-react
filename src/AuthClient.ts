import axios, {AxiosInstance, AxiosResponse} from "axios";
import { Buffer } from 'buffer';

interface Config {
    clientId: string;
    clientSecret: string;
    vedaAuthBaseUrl: string;
    redirectUri: string;
}

interface Data {
    custos_client_secret: string;
    authorization_endpoint: string;
}

interface TokenRequest {
    code: string;
    redirect_uri?: string;
    grant_type?: string; // TODO - will get back to this when PKCE is implemented
}

interface TokenResponse {
    access_token: string;
    refresh_token: string;
}

interface UserInfoResponse {
    sub: string;
    name: string;
    email: string;
    preferred_username: string;
}

class AuthClient {
    private config: Config;
    private axiosInstance: AxiosInstance;

    constructor(config: Config) {
        this.config = config;
        this.axiosInstance = axios.create({
            baseURL: this.config.vedaAuthBaseUrl,
            withCredentials: false,
            headers: {
                'Accept': '*/*',
                'Content-Type': 'application/json'
            }
        });
    }

    private async getClientSecret(clientId: string): Promise<string> {
        const {data: {custos_client_secret}}: AxiosResponse<Data> = await this.axiosInstance.get(
            `/identity-management/credentials`,
            {
                headers: {
                    'Authorization': `Bearer ${sessionStorage.getItem('access_token')}`
                },
                params: {
                    'client_id': clientId
                }
            }
        );
        return custos_client_secret;
    }

    private async getClientAuthBase64(clientId: string | null = null, clientSec: string | null = null): Promise<string> {
        if (clientId === null && clientSec === null) {
            clientId = this.config.clientId;
            clientSec = this.config.clientSecret;
        } else if (clientId !== null && clientSec === null) {
            clientSec = await this.getClientSecret(clientId);
        }

        let clientAuthBase64 = `${clientId}:${clientSec}`;
        clientAuthBase64 = Buffer.from(clientAuthBase64).toString('base64');
        clientAuthBase64 = `Bearer ${clientAuthBase64}`
        return clientAuthBase64;
    }

    public async fetchAuthorizationEndpoint(): Promise<void> {
        const openIdConfigEndpoint = "/identity-management/.well-known/openid-configuration";
        const redirectUri = this.config.redirectUri;
        const {data: {authorization_endpoint}}: AxiosResponse<Data> = await this.axiosInstance.get(openIdConfigEndpoint,
            {params: {'client_id': this.config.clientId,}});
        window.location.href = `${authorization_endpoint}?response_type=code&client_id=${this.config.clientId}&redirect_uri=${redirectUri}&scope=openid&kc_idp_hint=oidc`;
    }

    public async fetchToken({code}: TokenRequest): Promise<TokenResponse> {
        const clientAuthBase64 = await this.getClientAuthBase64();

        const {data} = await this.axiosInstance.post("/identity-management/token", {
            code: code,
            redirect_uri: this.config.redirectUri,
            grant_type: 'authorization_code'
        }, {
            headers: {
                'Authorization': clientAuthBase64
            }
        });
        return data;
    }

    public async fetchUserInfo(): Promise<UserInfoResponse> {
        const clientAuthBase64 = await this.getClientAuthBase64();
        const {data} = await this.axiosInstance.get("/user-management/userinfo", {
            params: {
                'access_token': sessionStorage.getItem('access_token')
            },
            headers: {
                'Authorization': clientAuthBase64
            }
        });
        return data;
    }

    public async handleRedirect(): Promise<void> {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        console.log("CODE: " + code);
        if (code === null || code === "") {
            return;
        }
        const tokenResponse = await this.fetchToken({code});
        console.log("TOKEN DATA: ", JSON.stringify(tokenResponse));
        sessionStorage.setItem("access_token", tokenResponse.access_token);
        sessionStorage.setItem("refresh_token", tokenResponse.refresh_token);
    }
}

export default AuthClient;
