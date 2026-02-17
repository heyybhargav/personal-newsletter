
import fs from 'fs';
import path from 'path';

async function main() {
    // Manual .env loading
    const envPath = path.resolve(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
        const envContent = fs.readFileSync(envPath, 'utf8');
        envContent.split('\n').forEach((line) => {
            const [key, ...valueParts] = line.split('=');
            if (key && valueParts.length > 0) {
                const value = valueParts.join('=').replace(/^["']|["']$/g, '').trim();
                process.env[key.trim()] = value;
            }
        });
    }

    // Dynamic import AFTER env is loaded
    const { sendWelcomeEmail } = await import('../lib/email');

    const email = process.argv[2] || process.env.USER_EMAIL;

    if (!email) {
        console.error("Error: No email provided and USER_EMAIL not set in .env.local");
        process.exit(1);
    }

    console.log(`Sending test welcome email to: ${email}`);

    try {
        await sendWelcomeEmail(email, 'https://signaldaily.me');
        console.log("Welcome email sent successfully!");
    } catch (error) {
        console.error("Failed to send welcome email:", error);
    }
}

main();
