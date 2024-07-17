let chatUID;

async function fetchHackathonIdeas() {
    const businessToken = document.getElementById('tokenInput').value;
    const ideasOutput = document.getElementById('ideasOutput');

    if (!businessToken) {
        alert("Please enter a business token.");
        return;
    }

    ideasOutput.innerHTML = '<p>Generating your winning idea...</p>'; // Display loading message in ideasOutput

    try {
        // Create a new chat session
        const chatResponse = await fetch('https://api.vcita.biz/v3/ai/bizai_chats', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + businessToken
            },
            body: JSON.stringify({ agent: 'vanilla', config: { window_size: 1 } })
        });
        const chatData = await chatResponse.json();
        chatUID = chatData.data.uid;

        // Send a predefined message to get hackathon ideas
        const messageResponse = await fetch(`https://api.vcita.biz/v3/ai/bizai_chat_messages?bizai_chat_uid=${chatUID}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + businessToken
            },
            body: JSON.stringify({
                type: "text",
                content: {
                    text: "Context: You are an AI innovation consultant tasked with propelling vcita, a CRM platform for SMBs from various appointment-first industries (such as lawyers, cleaners, roofers, hair stylists) into the future. vcita includes all CRM functionalities like client management, scheduling, payment processing, marketing campaigns, client notes, and more. Task: Innovate radically by suggesting an AI feature that could dramatically transform vcita with AI to be an industry leader in one of these ways: 1. automate manual tasks (for example: automated marketing campaign generator, auto-reply to clients, auto-scheduling appointments based on availability, auto-generation of estimates based on past estimates, voice record client notes that are automatically transcribed into the system), 2. save money (for example, create designed social media posts instead of hiring a designer, writing legal documents instead of paying for a lawyer, build a branded business website instead of paying a developer, website widget that serve as AI support representative), 3. increase their revenue (for example, lead scoring that helps business know which client to reach out to, automated upsell assistant to sell service packages). Instructions: Think of a random AI-based ability (like Machine Learning, Text Generation, Image generation, NLP, Speech to Text, Text to speech, Predictive Analytics) and combine it with an advanced CRM ability. Create a feature name that combines vcita's functionality with your random AI inspiration. Description: Explain how this AI feature would work within vcita, integrating it with existing tools if relevant. Business Value: Describe the potential benefits and revolutionary changes this feature could bring to SMB owners. Example: Imagine combining vcita with Text generation. AI Client Interactions: This feature would use AI to easily respond to clients, allowing to save time and effort for the business owners when interacting with clients. Business Value: This could dramatically improve engagement and conversion rates by providing an easier platform to respond to clients. Format your answer with markdown as follows: Suggested Idea, Description, Business Value."
                },
                streaming: true
            })
        });

        if (!messageResponse.ok) {
            throw new Error('Failed to send message');
        }

        await processStream(messageResponse);
    } catch (error) {
        console.error('Error:', error);
        ideasOutput.innerText = 'Failed to retrieve ideas. Check console for more information.';
    }
}

async function processStream(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let completeMessage = '';

    try {
        let reading = true;
        while (reading) {
            const { value, done } = await reader.read();
            if (done) {
                reading = false;
                break;
            }
            const textChunk = decoder.decode(value, { stream: true });
            completeMessage += textChunk;
        }
        displayCompleteMessage(completeMessage);
    } catch (error) {
        console.error('Error reading stream:', error);
    }
}

function displayCompleteMessage(rawData) {
    const messages = rawData.trim().split('\n').filter(line => line.trim());
    
    const fullMessage = messages.map(line => JSON.parse(line)).map(obj => obj.delta).join('');
    console.log(fullMessage);
    var converter = new showdown.Converter(),
    text      = '# hello, markdown!',
    html      = converter.makeHtml(fullMessage);

    document.getElementById('ideasOutput').innerHTML = `<p>${html}</p>`;
}
