import { getSession } from '@/lib/auth';
import { getArchiveListWithMetadata } from '@/lib/db';
import { redirect } from 'next/navigation';
import ArchiveClient from './ArchiveClient';

export default async function ArchivePage() {
    const session = await getSession();
    if (!session?.email) {
        redirect('/login');
    }

    const archives = await getArchiveListWithMetadata(session.email);

    return <ArchiveClient initialArchives={archives} />;
}
