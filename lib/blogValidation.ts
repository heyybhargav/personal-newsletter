import { BlogPost } from './blog';

export interface ValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Executes an 8-point Quality Gate check on a generated blog post.
 * If this fails, the post must NOT be published.
 */
export function validateGeneratedPost(post: any): ValidationResult {
    const errors: string[] = [];

    // 1. Structural Checks
    if (!post || typeof post !== 'object') {
        return { isValid: false, errors: ['Post is not a valid object'] };
    }

    if (!post.slug || typeof post.slug !== 'string') errors.push('Missing or invalid slug');
    if (!post.title || typeof post.title !== 'string') errors.push('Missing or invalid title');
    if (!post.content || !Array.isArray(post.content)) errors.push('Missing or invalid content array');

    if (errors.length > 0) return { isValid: false, errors }; // Hard fail early

    // 2. Length & Quality Boundaries (The "Human-Grade" Check)
    if (post.title.length < 15 || post.title.length > 120) {
        errors.push(`Title length (${post.title.length}) is outside SEO bounds (15-120)`);
    }

    if (!post.metaDescription || post.metaDescription.length < 50 || post.metaDescription.length > 180) {
        errors.push(`Meta description length restricts SEO visibility`);
    }

    // 3. Content Depth Checks
    if (post.content.length < 3) {
        errors.push(`Content is too thin (${post.content.length} sections). Minimum 3 required.`);
    }

    let totalParagraphs = 0;
    let hasEmptySections = false;

    for (const section of post.content) {
        if (!section.paragraphs || section.paragraphs.length === 0) {
            hasEmptySections = true;
        } else {
            totalParagraphs += section.paragraphs.length;

            // Protect against massive walls of text outputted by lazy LLMs
            for (const para of section.paragraphs) {
                if (para.length > 600) {
                    errors.push('Found a paragraph exceeding 600 chars. Violates short-punchy brand voice.');
                }
            }
        }
    }

    if (hasEmptySections) {
        errors.push('Found sections with empty paragraph arrays.');
    }

    if (totalParagraphs < 4) {
        errors.push(`Post is too short (${totalParagraphs} paragraphs). Does not meet depth requirements.`);
    }

    // 4. Banned keyword check (Safety net for Writer phase failure)
    const rawText = JSON.stringify(post.content).toLowerCase();
    const bannedWords = ['delve', 'tapestry', 'testament to'];
    for (const word of bannedWords) {
        if (rawText.includes(word)) {
            errors.push(`Found banned word in content: "${word}"`);
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}
