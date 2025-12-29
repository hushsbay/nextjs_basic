import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import type { NextAuthOptions } from 'next-auth';
import { upsertSocialUser, issueSocialLoginTokens } from '@/lib/server/auth';

export const authOptions: NextAuthOptions = {
    providers: [
        GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID || '',
            clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        }),
        // 카카오는 나중에 추가 예정
        // KakaoProvider({
        //     clientId: process.env.KAKAO_CLIENT_ID || '',
        //     clientSecret: process.env.KAKAO_CLIENT_SECRET || '',
        // }),
    ],
    pages: {
        signIn: '/login', // 커스텀 로그인 페이지
        error: '/login', // 에러 발생 시 리다이렉트
    },
    callbacks: {
        async signIn({ user, account, profile }) {
            try {
                if (!user.email) {
                    console.error('Social login failed: No email provided');
                    return false;
                }

                // 소셜 로그인 제공자 확인
                const provider = account?.provider || 'unknown';
                
                // DB에 사용자 저장 또는 업데이트
                const dbUser = await upsertSocialUser(
                    user.email,
                    user.name || user.email.split('@')[0],
                    provider
                );

                // 자체 JWT 토큰 발급
                const tokenResult = await issueSocialLoginTokens(
                    dbUser.userid,
                    dbUser.usernm,
                    dbUser.email
                );

                if (!tokenResult.success) {
                    console.error('Token generation failed:', tokenResult.message);
                    return false;
                }

                // 토큰을 user 객체에 저장 (jwt 콜백에서 사용)
                (user as any).customAccessToken = tokenResult.accessToken;
                (user as any).customRefreshToken = tokenResult.refreshToken;
                (user as any).userid = dbUser.userid;
                (user as any).usernm = dbUser.usernm;

                return true;
            } catch (error) {
                console.error('SignIn callback error:', error);
                return false;
            }
        },
        async jwt({ token, user, account }) {
            // 첫 로그인 시 user 정보를 token에 저장
            if (user) {
                token.userid = (user as any).userid;
                token.usernm = (user as any).usernm;
                token.email = user.email;
                token.customAccessToken = (user as any).customAccessToken;
                token.customRefreshToken = (user as any).customRefreshToken;
            }
            return token;
        },
        async session({ session, token }) {
            // 세션에 사용자 정보 추가
            if (token) {
                (session.user as any).userid = token.userid;
                (session.user as any).usernm = token.usernm;
                (session.user as any).email = token.email;
                (session as any).customAccessToken = token.customAccessToken;
                (session as any).customRefreshToken = token.customRefreshToken;
            }
            return session;
        },
        async redirect({ url, baseUrl }) {
            // 소셜 로그인 성공 후 리다이렉트
            // 토큰을 쿼리 파라미터로 전달하거나 별도 페이지로 이동
            if (url.startsWith(baseUrl)) {
                return `${baseUrl}/auth/callback`;
            }
            return baseUrl;
        },
    },
    session: {
        strategy: 'jwt',
        maxAge: 30 * 24 * 60 * 60, // 30일
    },
    secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
