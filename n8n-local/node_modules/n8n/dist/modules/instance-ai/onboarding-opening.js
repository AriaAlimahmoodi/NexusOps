"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ONBOARDING_OPENING = void 0;
exports.ONBOARDING_OPENING = {
    title: 'Welcome to n8n',
    greeting: [
        "Hi {{firstName}}, I'm your Assistant.",
        'Think of me as your n8n expert.',
        'Two final questions, so I can suggest automations for you.',
    ].join('\n\n'),
    followUp: 'Last one: what do you usually do in {{apps}}?',
    questions: [
        {
            id: 'team',
            question: 'What team are you on?',
            type: 'single',
            required: true,
            options: ['Executive/Owner', 'Support', 'Product & Design', 'Sales', 'IT', 'Engineering', 'Marketing'],
        },
        {
            id: 'apps',
            question: 'Which apps do you use most in your {{team}} work?',
            type: 'multi',
            required: true,
            options: ['Google Sheets', 'Gmail', 'Telegram', 'Google Drive', 'WhatsApp', 'Slack', 'Airtable'],
            optionsByAnswer: {
                questionId: 'team',
                options: {
                    'Executive/Owner': ['Google Calendar', 'LinkedIn', 'Slack', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    Support: ['Zendesk', 'Intercom', 'Slack', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    'Product & Design': ['Linear', 'Notion', 'Supabase', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    Sales: ['HubSpot', 'Salesforce', 'LinkedIn', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    IT: ['Slack', 'Microsoft Teams', 'Jira', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    Engineering: ['GitHub', 'Jira', 'Linear', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                    Marketing: ['Facebook', 'LinkedIn', 'YouTube', 'Google Sheets', 'Gmail', 'WhatsApp', 'Telegram'],
                },
            },
        },
    ],
};
//# sourceMappingURL=onboarding-opening.js.map