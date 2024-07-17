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
                    text: "Context: You are an AI innovation consultant assigned to enhance vcita, a comprehensive CRM platform tailored for SMBs across diverse appointment-centric industries like healthcare, legal services, home maintenance, beauty, and more. vcita integrates essential CRM features including client management, appointment scheduling, payment processing, marketing, client note taking, and client communication. Task: As part of a think tank, your goal is to leverage AI to radically innovate vcita, positioning it as a trailblazer within the CRM space. Focus on one of the following transformation avenues: Automation: Streamline or eliminate manual processes. Ideas could include an AI-driven decision support system to optimize daily schedules, an intelligent chatbot that handles initial client consultations, or an AI that predicts and fills appointment cancellations in real-time. Cost Reduction: Employ AI to decrease operational costs. Consider developing features like an AI that customizes and optimizes marketing spending across platforms, or a tool that auto-generates legal and compliance documents relevant to the user industry. Revenue Enhancement: Introduce features that significantly boost revenue. This could involve a dynamic pricing model that adjusts service rates based on demand and client loyalty, or an AI that curates personalized service bundles for clients based on their usage patterns and satisfaction. Instructions: Think of a random AI-based ability (like Machine Learning, Text Generation, Image generation, NLP, Speech to Text, Text to speech, Predictive Analytics) and combine it with an advanced CRM ability. Create a feature name that combines vcita's functionality with your random AI inspiration. Description: Explain how this AI feature would work within vcita, integrating it with existing tools if relevant. Business Value: Describe the potential benefits and revolutionary changes this feature could bring to SMB owners. Example: Imagine combining vcita with Text generation. AI Client Interactions: This feature would use AI to easily respond to clients, allowing to save time and effort for the business owners when interacting with clients. Business Value: This could dramatically improve engagement and conversion rates by providing an easier platform to respond to clients. Format your answer with markdown as follows: Suggested Idea, Description, Business Value."
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
