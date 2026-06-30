import { authAdmin } from './firebaseAdmin';

export interface DecodedSession {
  uid: string;
  email?: string;
  role: 'owner' | 'staff';
  status: 'active' | 'inactive';
  name?: string;
}

export async function getSession(req: Request): Promise<DecodedSession | null> {
  const sessionCookie = req.headers.get('cookie')
    ?.split('; ')
    .find(c => c.startsWith('__session='))
    ?.split('=')[1];

  if (!sessionCookie || !authAdmin) return null;

  try {
    const decodedClaims = await authAdmin.verifySessionCookie(sessionCookie, true);
    return {
      uid: decodedClaims.uid,
      email: decodedClaims.email,
      role: decodedClaims.role as 'owner' | 'staff',
      status: decodedClaims.status as 'active' | 'inactive',
      name: decodedClaims.name
    };
  } catch (error) {
    return null;
  }
}
