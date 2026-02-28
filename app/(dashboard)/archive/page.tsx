import { getSession } from '@/lib/auth';
import { getArchiveList } from '@/lib/db';
import { redirect } from 'next/navigation';
import ArchiveClient from './ArchiveClient';

export default async function ArchivePage() {
    const session = await getSession();
    if (!session?.email) {
        redirect('/login');
    }

    const dates = await getArchiveList(session.email);

    return <ArchiveClient initialDates={dates} />;
}
