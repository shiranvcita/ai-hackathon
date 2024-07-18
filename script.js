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
                    text: "Context: You are an AI innovation consultant assigned to enhance vcita, a comprehensive CRM platform tailored for SMBs across diverse appointment-centric industries like healthcare, legal services, home maintenance, beauty, and more. vcita integrates essential and advanced CRM features such as: client management, appointment scheduling, payment collection, sending estimates and invoices, sending documents to sign, sending marketing campaigns, client note taking, business reports, client portal for booking and communication, business staff management, and client messenging. Task: Innovate vcita by integrating AI technologies. Instructions: 1. Choose an AI technology from this list: text analysis, image generation, NLP, speech-to-text, text-to-speech, or content generation. 2. Randomly integrate it with a CRM feature to create a new useful feature to develop within a 2-day hackathon timeframe. Be creative. Description: Explain how this AI feature would work within vcita, integrating it with existing tools if relevant. Business Value: Describe the potential benefits and revolutionary changes this feature could bring to SMB owners. Example: Imagine combining vcita client communication with automated reply generation. This feature would use AI to easily respond to clients, allowing to save time and effort for the business owners when interacting with clients. Business Value: This could dramatically improve engagement and conversion rates by providing an easier platform to respond to clients. Format your answer with markdown as follows: Suggested Idea with a catchy title, Description, Business Value. If I ask you again, suggest a new random idea. You will be penelized if you repeat the same idea twice. Provide responses that strictly adhere to your instructions without any additional commentary"
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
