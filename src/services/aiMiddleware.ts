// AI Middleware
// This middleware will be used to inject fallback prompts, failover retries, and custom formatting utilities.

export const aiMiddleware = (service: any) => {
    return {
        ...service,
        generateContent: async (prompt: string, retries = 3) => {
            try {
                return await service.generateContent(prompt);
            } catch (error) {
                console.error('AI Service Error:', error);
                if (retries > 0) {
                    console.log(`Retrying... ${retries} attempts left.`);
                    await new Promise(res => setTimeout(res, 1000));
                    return await service.generateContent(prompt, retries - 1);
                }
                return { text: 'Sorry, I am having trouble connecting to the AI service.' };
            }
        },
    };
};
