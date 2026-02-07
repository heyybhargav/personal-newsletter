import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SECRET_KEY = process.env.JWT_SECRET_KEY || 'default-secret-key-change-me-in-prod';
const key = new TextEncoder().encode(SECRET_KEY);

export interface UserSession {
    email: string;
    iat?: number;
    exp?: number;
}

export async function signSession(payload: UserSession): Promise<string> {
    const token = await new SignJWT({ ...payload })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('30d') // Long-lived session
        .sign(key);
    return token;
}

export async function verifySession(token: string): Promise<UserSession | null> {
    try {
        const { payload } = await jwtVerify(token, key, {
            algorithms: ['HS256'],
        });
        return payload as unknown as UserSession;
    } catch (error) {
        return null;
    }
}

export async function getSession(): Promise<UserSession | null> {
    const cookieStore = await cookies();
    const token = cookieStore.get('user_session')?.value;
    if (!token) return null;
    return await verifySession(token);
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('user_session');
}
