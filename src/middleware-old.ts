import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

export default NextAuth(authConfig).auth

export const config = {
    matcher: ['/((?!api|_next/satic|_next/image|.*\\.png$).*)'],
}