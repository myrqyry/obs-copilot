import { StreamerBotService } from './src/services/streamerBotService.js';

// Test StreamerBot WebSocket integration
async function testStreamerBot() {
    console.log('Testing StreamerBot WebSocket integration...');
    
    const streamerBotService = StreamerBotService.getInstance();
    
    try {
        // Test connection to localhost:8080 (default StreamerBot port)
        console.log('Attempting to connect to StreamerBot at localhost:8080...');
        await streamerBotService.connect('localhost', 8080);
        console.log('✅ Connected successfully!');
        
        // Test getting info
        try {
            const info = await streamerBotService.getInfo();
            console.log('✅ GetInfo successful:', info);
        } catch (error) {
            console.log('ℹ️ GetInfo not supported or failed:', error.message);
        }
        
        // Test getting actions
        try {
            const actions = await streamerBotService.getActions();
            console.log('✅ GetActions successful, found', actions.length, 'actions');
        } catch (error) {
            console.log('ℹ️ GetActions not supported or failed:', error.message);
        }
        
        // Test getting events
        try {
            const events = await streamerBotService.getEvents();
            console.log('✅ GetEvents successful:', Object.keys(events.events).length, 'event categories');
        } catch (error) {
            console.log('ℹ️ GetEvents not supported or failed:', error.message);
        }
        
        // Disconnect
        streamerBotService.disconnect();
        console.log('✅ Disconnected successfully!');
        
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        console.log('Please make sure StreamerBot is running with WebSocket server enabled on port 8080');
    }
}

// Run the test
testStreamerBot().catch(console.error);
