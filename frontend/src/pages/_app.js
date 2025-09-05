//wrap the app with authcontext
import { AuthProvider } from "../contexts/AuthContext";

function MyApp({Component, pageProps}){
    return (
        <AuthProvider>
            <Component {...pageProps}/>
        </AuthProvider>
    );
}

export default MyApp;