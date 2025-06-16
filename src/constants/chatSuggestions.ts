export interface Suggestion {
    id: string;
    label: string;
    prompt: string;
    emoji?: string;
}

export const allChatSuggestions: Suggestion[] = [
    { id: "sg1", label: "Scene Sources?", prompt: "What are the sources in the current scene?", emoji: "🖼️" },
    { id: "sg2", label: "Switch Scene", prompt: "Switch to another scene.", emoji: "🎬" },
    { id: "sg3", label: "Create Text", prompt: "I want to create a text source in the current scene.", emoji: "✍️" },
    { id: "sg4", label: "Game Stream Ideas", prompt: "Suggest 3 unique ideas for my gameplay stream today.", emoji: "💡" },
    { id: "sg5", label: "Hide Source", prompt: "Hide a source in the current scene.", emoji: "🙈" },
    { id: "sg6", label: "Show Source", prompt: "Show a source in the current scene.", emoji: "👁️" },
    { id: "sg7", label: "Stream/Record Status?", prompt: "What is the current status of my stream and recording?", emoji: "📡" },
    { id: "sg8", label: "Set Text", prompt: "I want to change the text of a source in the current scene.", emoji: "💬" },
    { id: "sg9", label: "Add Filter", prompt: "I want to add a filter to a source.", emoji: "🎨" },
    { id: "sg10", label: "30s Ad Script", prompt: "Can you give me a script for a 30-second ad read? What product should I advertise?", emoji: "📜" },
    { id: "sg11", label: "Royalty-Free Music?", prompt: "What are some good websites for royalty-free music for streaming?", emoji: "🎵" },
    { id: "sg12", label: "Fix Audio Crackle", prompt: "I'm hearing audio crackling in OBS, what are common fixes?", emoji: "🛠️" },
    { id: "sg13", label: "Canvas to 1080p?", prompt: "How do I change my OBS canvas resolution to 1920x1080?", emoji: "🎞️" },
    { id: "sg14", label: "Duplicate Scene", prompt: "Duplicate the current scene.", emoji: "➕" },
    { id: "sg15", label: "Screenshot Source", prompt: "I want to take a screenshot of a source in the current scene.", emoji: "📸" },
    { id: "sg16", label: "Transition Duration", prompt: "Set the current scene transition duration.", emoji: "⏱️" },
    { id: "sg17", label: "Open Filters", prompt: "Open the filters dialog for a source.", emoji: "⚙️" },
    { id: "sg18", label: "What's new in OBS?", prompt: "Using Google Search, tell me about the latest OBS Studio features.", emoji: "🔍" },
    { id: "sg19", label: "List video settings", prompt: "What are my current video settings in OBS?", emoji: "⚙️" },
    { id: "sg20", label: "Toggle Studio Mode", prompt: "Toggle OBS Studio Mode.", emoji: "🎭" },
];

export const getRandomSuggestions = (count: number): Suggestion[] => {
    const shuffled = [...allChatSuggestions].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
};

export const genericSourcePrompts = [
    "Hide a source in the current scene.",
    "Show a source in the current scene.",
    "Set the text of a source in the current scene.",
    "Add a color correction filter to a source.",
    "Get a PNG screenshot of a source in the current scene.",
    "Open the filters dialog for a source."
];
