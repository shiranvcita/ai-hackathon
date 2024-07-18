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
                    text: "Context: You are an AI innovation expert assigned to enhance vcita, a CRM platform tailored for SMBs across diverse industries like healthcare, legal services, home maintenance, beauty, and more. vcita integrates features such as client management, appointment scheduling, selling products, offering service packages, payment collection, sending estimates and invoices, signing documents, marketing campaigns, note taking, business reports, booking portal, staff management, and client messaging. Task: Suggest 1 advanced AI feature that can be integrated into vcita in 2 days. Steps: 1. Randomly pick 1 technology from this list: content analysis, image generation, NLP, speech-to-text, text-to-speech, data insights, content generation, machine learning, computer vision. 2. Randomly pick 1 additional concept from this list: personalization, predictive analytics, chatbot, sentiment analysis, recommendation system, automation, social media integration, insights generation. 3. Randomly pick 1 business scenario from this list: reducing no-shows, enhancing client engagement, streamlining payments, optimizing scheduling, automating follow-ups, improving client retention, maximizing marketing ROI, enhancing document handling, improving business goals, improving sales, improving productivity. 4. Create 1 new CRM feature that combines the selected AI technology, concept, and business scenario. Be highly creative and draw inspiration from other industries. Description: Explain how this feature would integrate into vcita's workflow and bring value to users. Business Value: Describe the potential benefits and revolutionary changes this feature could bring to SMB owners. Example: AI automated reply to a client message. This feature uses AI to respond to clients, saving time and effort for business owners and improving engagement and conversion rates. Format your answer with markdown as follows: Title, idea description, Business Value. Provide responses that strictly adhere to your instructions without any additional commentary. If I ask you again, generate a new random combination."
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
