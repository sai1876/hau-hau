import { NextResponse } from 'next/server';
import { firestore } from '../../../../services/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username');

    if (!username) {
      return NextResponse.json({ error: 'Username is required' }, { status: 400 });
    }

    const lowerUsername = username.toLowerCase().trim();

    // Direct hardcoded mappings for standard dashboard profiles
    if (lowerUsername === 'owner') {
      return NextResponse.json({ email: 'owner@hauhau.com' });
    }
    if (lowerUsername === 'admin') {
      return NextResponse.json({ email: process.env.NEXT_PUBLIC_PRODUCTION_OWNER_EMAIL || 'cherukuridakshithsai@gmail.com' });
    }
    if (lowerUsername === 'owner-demo') {
      return NextResponse.json({ email: 'owner-demo@hauhau.com' });
    }
    if (lowerUsername === 'staff') {
      return NextResponse.json({ email: 'staff@hauhau.com' });
    }
    if (lowerUsername === 'staff-demo') {
      return NextResponse.json({ email: 'staff-demo@hauhau.com' });
    }

    if (!firestore) {
      return NextResponse.json({ email: username });
    }

    // Query Firestore staff collection for custom username match using client SDK
    const staffCol = collection(firestore, 'staff');
    const q = query(staffCol, where('username', '==', username), limit(1));
    const snapshot = await getDocs(q);

    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      return NextResponse.json({ email: doc.data().emailOrPhone });
    }

    // Case insensitive fallback query
    const allStaff = await getDocs(staffCol);
    for (const doc of allStaff.docs) {
      const data = doc.data();
      if (data.username && data.username.toLowerCase() === lowerUsername) {
        return NextResponse.json({ email: data.emailOrPhone });
      }
    }

    return NextResponse.json({ email: username });
  } catch (error: any) {
    console.error('Resolve Email Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
