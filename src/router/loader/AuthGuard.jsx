import { redirect } from "react-router-dom";

const authGuard = () => {
    const hasOidc = Object.keys(sessionStorage).some((k) => k.startsWith("oidc.user:"));
    const legacyToken = localStorage.getItem("JWT_TOKEN");

    if (!hasOidc && !legacyToken) {
        throw redirect("/sso/start");
    }
};

export default authGuard;