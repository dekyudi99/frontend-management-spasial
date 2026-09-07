import { redirect } from "react-router-dom";
import { message } from "antd";

const authGuard = () => {
    const token = localStorage.getItem("JWT_TOKEN")

    if (!token) {
        message.warning("Token anda Salah atau Sudah Kadaluarsa!")
        throw redirect("/auth/login")
    }
}

export default authGuard