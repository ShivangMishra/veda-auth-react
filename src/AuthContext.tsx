import {createContext} from "react";
import {AuthContextType} from "./AuthProvider.tsx";

const AuthContext = createContext<AuthContextType | null>(null);

export default AuthContext;

