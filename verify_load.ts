import { getUser } from './lib/db';

async function checkLoadTest() {
    console.log("Fetching user stats to see if the 100 tests completely fired...");
    const email = 'cbhargav2002@gmail.com';
    const user = await getUser(email);

    if (user) {
        console.log(`\nUser: ${user.email}`);
        console.log(`Total Briefings Sent (Historically + Today): ${user.stats?.totalBriefingsSent}`);
        console.log(`Input Tokens: ${user.stats?.inputTokens}`);
        console.log(`Output Tokens: ${user.stats?.outputTokens}`);
        console.log(`Last Digest At: ${user.lastDigestAt}`);
    } else {
        console.log("User not found!");
    }
}

checkLoadTest().catch(console.error);
