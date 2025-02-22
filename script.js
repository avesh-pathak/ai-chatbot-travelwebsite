document.addEventListener('DOMContentLoaded', () => {
    const sendButton = document.getElementById('send-button');
    const userInput = document.getElementById('user-input');
    const chatBox = document.getElementById('chat-box');
    const clearChatButton = document.getElementById('clear-chat');
    const toggleThemeButton = document.getElementById('toggle-theme');
    const saveChatButton = document.getElementById('save-chat');
    const exportPdfButton = document.getElementById('export-pdf');
    const quickActions = document.querySelectorAll('.quick-action');
    const toggleChatButton = document.getElementById('toggle-chat');
    const togglePlannerButton = document.getElementById('toggle-planner');
    const chatSection = document.getElementById('chat-section');
    const plannerSection = document.getElementById('planner-section');
    const tripForm = document.getElementById('trip-form');
    const tripPlan = document.getElementById('trip-plan');

    sendButton.addEventListener('click', sendMessage);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });

    clearChatButton.addEventListener('click', clearChat);
    toggleThemeButton.addEventListener('click', toggleTheme);
    saveChatButton.addEventListener('click', saveChat);
    exportPdfButton.addEventListener('click', exportPdf);

    quickActions.forEach(button => {
        button.addEventListener('click', () => sendQuickAction(button.dataset.action));
    });

    toggleChatButton.addEventListener('click', () => toggleSection(chatSection));
    togglePlannerButton.addEventListener('click', () => toggleSection(plannerSection));

    tripForm.addEventListener('submit', generateTripPlan);

    // Load chat history from localStorage
    loadChatHistory();

    async function sendMessage() {
        const message = userInput.value.trim();
        if (!message) return;

        displayMessage('You: ' + message, 'user-message');
        userInput.value = '';

        try {
            const response = await generateText(message);
            displayMessage('Travel Sage: ' + formatResponse(response), 'bot-message');
        } catch (error) {
            console.error('Error:', error);
            displayMessage('Travel Sage: Sorry, there was an error. Please try again later.', 'bot-message');
        }

        // Save chat history to localStorage
        saveChatHistory();
    }

    async function generateText(prompt) {
        const response = await fetch('https://api-inference.huggingface.co/models/mistralai/Mistral-Nemo-Instruct-2407', {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer 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',
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                inputs: prompt,
                parameters: {
                    max_new_tokens: 500,
                },
            }),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data[0].generated_text;
    }

    function formatResponse(response) {
        // Split the response into sentences
        const sentences = response.split(/(?<=[.!?])\s+/);
        
        // If there's only one sentence, return it as is
        if (sentences.length === 1) {
            return response;
        }

        // Format multiple sentences as bullet points
        return '<ul>' + sentences.map(sentence => `<li>${sentence}</li>`).join('') + '</ul>';
    }

    function displayMessage(message, className) {
        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.innerHTML = message;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function clearChat() {
        chatBox.innerHTML = '';
        localStorage.removeItem('chatHistory');
    }

    function toggleTheme() {
        document.body.classList.toggle('dark-theme');
        const isDarkTheme = document.body.classList.contains('dark-theme');
        localStorage.setItem('darkTheme', isDarkTheme);
        updateThemeIcon(isDarkTheme);
    }

    function updateThemeIcon(isDarkTheme) {
        const icon = toggleThemeButton.querySelector('i');
        icon.className = isDarkTheme ? 'fas fa-sun' : 'fas fa-moon';
    }

    function saveChatHistory() {
        localStorage.setItem('chatHistory', chatBox.innerHTML);
    }

    function loadChatHistory() {
        const savedHistory = localStorage.getItem('chatHistory');
        if (savedHistory) {
            chatBox.innerHTML = savedHistory;
            chatBox.scrollTop = chatBox.scrollHeight;
        }

        // Load theme preference
        const isDarkTheme = localStorage.getItem('darkTheme') === 'true';
        if (isDarkTheme) {
            document.body.classList.add('dark-theme');
        }
        updateThemeIcon(isDarkTheme);
    }

    function saveChat() {
        const chatContent = chatBox.innerText;
        const blob = new Blob([chatContent], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'travel_sage_chat.txt';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function exportPdf() {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        
        const chatContent = chatBox.innerText;
        const lines = doc.splitTextToSize(chatContent, 180);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(12);
        
        let yPos = 20;
        lines.forEach(line => {
            if (yPos > 280) {
                doc.addPage();
                yPos = 20;
            }
            doc.text(line, 15, yPos);
            yPos += 7;
        });
        
        doc.save("travel_sage_chat.pdf");
    }

    function sendQuickAction(action) {
        let message = '';
        switch (action) {
            case 'popular-destinations':
                message = 'What are some popular travel destinations?';
                break;
            case 'travel-tips':
                message = 'Can you give me some general travel tips?';
                break;
            case 'packing-list':
                message = 'What should I include in my travel packing list?';
                break;
            case 'local-cuisine':
                message = 'Tell me about popular local cuisines around the world.';
                break;
            case 'cultural-etiquette':
                message = 'What are some important cultural etiquette tips for travelers?';
                break;
        }
        userInput.value = message;
        sendMessage();
    }

    function toggleSection(sectionToShow) {
        chatSection.classList.remove('active');
        plannerSection.classList.remove('active');
        sectionToShow.classList.add('active');
    }

    async function generateTripPlan(e) {
        e.preventDefault();
        const destination = document.getElementById('destination').value;
        const duration = document.getElementById('duration').value;
        const budget = document.getElementById('budget').value;
        const interests = Array.from(document.getElementById('interests').selectedOptions).map(option => option.value);

        const prompt = `Create a detailed ${duration}-day trip plan for ${destination} with a budget of $${budget}. The traveler is interested in ${interests.join(', ')}. Provide a day-by-day itinerary with suggested activities, attractions, and dining options. Include estimated costs for activities and meals where possible. Suggest accommodation options that fit within the budget. Also, provide some local travel tips and cultural insights specific to ${destination}.`;

        tripPlan.innerHTML = '<p>Generating your personalized trip plan...</p>';

        try {
            const response = await generateText(prompt);
            tripPlan.innerHTML = `<h3>Your ${duration}-Day Trip to ${destination}</h3>${formatResponse(response)}`;
        } catch (error) {
            console.error('Error:', error);
            tripPlan.innerHTML = '<p>Sorry, there was an error generating your trip plan. Please try again later.</p>';
        }
    }
});