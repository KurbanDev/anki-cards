const API_KEY = 'sk-aitunnel-GuOGhtT1DoFYtOC0msO8JSBsTebfVEfb'

export function useAi() {

    async function send(question) {
        try {
            const response = await fetch('https://api.aitunnel.ru/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${API_KEY}`
                },
                body: JSON.stringify({
                    model: "gpt-5-chat", // Ваша запрошенная модель
                    max_tokens: 1000,
                    messages: [
                        {
                            role: 'user',
                            content: question,
                        }
                    ]
                })
            });

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error(error);
        }


    }

    return {
        send
    }
}