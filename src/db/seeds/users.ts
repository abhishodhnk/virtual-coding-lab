import { db } from '@/db';
import { users } from '@/db/schema';

async function main() {
    const sampleUsers = [
        {
            id: 'teacher123',
            email: 'john.teacher@example.com',
            fullName: 'John Teacher',
            role: 'teacher',
            createdAt: new Date('2024-12-01').toISOString(),
        },
        {
            id: 'teacher456',
            email: 'jane.instructor@example.com',
            fullName: 'Jane Instructor',
            role: 'teacher',
            createdAt: new Date('2024-12-05').toISOString(),
        },
        {
            id: 'student456',
            email: 'alice.student@example.com',
            fullName: 'Alice Student',
            role: 'student',
            createdAt: new Date('2024-12-10').toISOString(),
        },
        {
            id: 'student789',
            email: 'bob.learner@example.com',
            fullName: 'Bob Learner',
            role: 'student',
            createdAt: new Date('2024-12-15').toISOString(),
        },
        {
            id: 'student012',
            email: 'charlie.coder@example.com',
            fullName: 'Charlie Coder',
            role: 'student',
            createdAt: new Date('2024-12-20').toISOString(),
        }
    ];

    await db.insert(users).values(sampleUsers);
    
    console.log('✅ Users seeder completed successfully');
}

main().catch((error) => {
    console.error('❌ Seeder failed:', error);
});