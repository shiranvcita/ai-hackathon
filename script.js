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
            body: JSON.stringify({ agent: 'vanilla', config: { window_size: 10 }})
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
                    text: "Context: You are an AI innovation expert assigned to enhance vcita, a CRM platform tailored for SMBs across diverse industries like healthcare, legal services, home maintenance, beauty, and more. vcita integrates features such as client management, appointment scheduling, selling products, offering service packages, payment collection, sending estimates and invoices, signing documents, marketing campaigns, note taking, business reports, booking portal, staff management, and client messaging. Task: Propose an advanced AI feature that could be developed for vcita in 48 hours. Steps: 1. **Technology Selection**: Randomly choose 1 item from this list: - Content Analysis - Image Generation - Natural Language Processing (NLP) - Speech-to-Text - Text-to-Speech - Data Insights - Content Generation - Machine Learning - Computer Vision 2. **Concept Selection**: Randomly select 1 item from this list: - Personalization - Predictive Analytics - Chatbot - Sentiment Analysis - Recommendation System - Automation - Social Media Integration - Insights Generation 3. **Business Scenario**: Choose 1 random business aspect to improve: - Reducing No-shows - Enhancing Client Engagement - Streamlining Payments - Optimizing Scheduling - Automating Follow-ups - Improving Client Retention - Maximizing Marketing ROI - Enhancing Document Handling - Boosting Sales - Increasing Productivity - Generating Business Insights **Instruction**: Randomly integrate the chosen technology, concept, and scenario to invent an advanced AI feature. Draw inspiration from various industries to enhance creativity. Description: Explain how this feature would integrate into vcita's workflow and bring value to users. Business Value: Describe the potential benefits and revolutionary changes this feature could bring to SMB owners. Format your answer with markdown as follows: Title, idea description, Business Value. Provide responses that strictly adhere to your instructions without any additional commentary.**Randomization Note**: Ensure each suggestion is unique. Reset selections regularly to avoid repetition. Provide a novel combination when prompted again."
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
