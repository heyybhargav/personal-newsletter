import * as https from 'https';

const API_KEY = process.env.CRON_SECRET || '6hS5Hfq9pTOIPhupZtxSnghh'; // Replace with actual production secret
// Production URL
const URL = 'https://www.signaldaily.me/api/digest/generate';
const TARGET_EMAIL = 'cbhargav2002@gmail.com';
const MAX_CONCURRENT = 10;

async function runLoadTest() {
    console.log(`🚀 Starting pure concurrent load test against Production URL: ${URL}`);
    console.log(`🎯 Sending ${MAX_CONCURRENT} REAL parallel requests in 3... 2... 1...`);

    // We want to fire all fetches truly at the exact same time
    const promises = Array.from({ length: MAX_CONCURRENT }).map((_, i) => {
        return fetch(URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                email: TARGET_EMAIL,
                force: true,  // Force it to skip time checks and run immediately
                dryRun: false // ACTUALLY SEND THE EMAIL AND RECORD METRICS
            }),
            // Set longer keepAlive timeout to handle 100 connections
            keepalive: true,
        }).then(async res => {
            const text = await res.text();
            return { index: i, status: res.status, ok: res.ok, body: text.substring(0, 100) };
        }).catch(err => {
            return { index: i, status: 'NETWORK_ERROR', ok: false, body: err.message };
        });
    });

    const startTime = Date.now();

    const results = await Promise.allSettled(promises);

    const duration = Date.now() - startTime;

    let successCount = 0;
    let failCount = 0;
    const errors: Record<string, number> = {};

    results.forEach((res) => {
        if (res.status === 'fulfilled') {
            const val = res.value;
            if (val.ok) {
                successCount++;
            } else {
                failCount++;
                errors[val.status] = (errors[val.status] || 0) + 1;
                console.log(`Failed req ${val.index}: [${val.status}] ${val.body}`);
            }
        }
    });

    console.log('\n--- LOAD TEST RESULTS ---');
    console.log(`Total Requests: ${MAX_CONCURRENT}`);
    console.log(`Time to dispatch & receive ALL Acks: ${duration}ms`);
    console.log(`✅ Success (200 OK - Background Queued): ${successCount}`);
    console.log(`❌ Failed: ${failCount}`);

    if (failCount > 0) {
        console.log('Error Breakdown:', errors);
        console.log('\n⚠️ NOTE: Because the LLM generation happens in the Vercel background queue, a 200 OK means Vercel successfully accepted all 100 tasks into its parallel backend. You must check Vercel Logs to see if the LLM APIs rate-limited the actual background tasks over the next 60 seconds.');
    } else {
        console.log('\n🎉 All 100 requests were successfully dispatched to the Vercel edge and queued in parallel! Check Vercel logs to see the LLM APIs churning through them.');
    }
}

runLoadTest().catch(console.error);
