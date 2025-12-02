import { db } from '@/db';
import { labSessions } from '@/db/schema';

async function main() {
    const sampleLabSessions = [
        {
            id: 1,
            sessionCode: 'TEST01',
            title: 'Introduction to Python',
            description: 'Learn Python basics',
            teacherId: 'teacher123',
            isActive: true,
            createdAt: new Date('2024-12-20').toISOString(),
        },
        {
            sessionCode: 'JS2024',
            title: 'JavaScript Fundamentals',
            description: 'Master JavaScript concepts',
            teacherId: 'teacher123',
            isActive: true,
            createdAt: new Date('2024-12-22').toISOString(),
        },
        {
            sessionCode: 'WEB101',
            title: 'Web Development Bootcamp',
            description: 'Build your first website',
            teacherId: 'teacher456',
            isActive: true,
            createdAt: new Date('2024-12-25').toISOString(),
        }
    ];

    try {
        await db.insert(labSessions).values(sampleLabSessions).onConflictDoNothing();
        console.log('✅ Lab sessions seeder completed successfully');
    } catch (error) {
        console.error('❌ Seeder failed:', error);
        throw error;
    }
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});