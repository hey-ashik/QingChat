# QingChat

QingChat is a lightweight, frontend-only chat application that acts as an interface to any conversational AI API (such as OpenAI, Grok, or your custom backend). It does not run any models itself; instead, it forwards messages to a configured API endpoint and displays the responses.

## Features

- Minimal, clean chat UI
- Sends user messages to a configurable API endpoint
- Displays bot/AI responses in real time
- Built with HTML, CSS, and JavaScript

## How It Works

1. User enters a message in the chat box.
2. QingChat sends the message to your configured API endpoint.
3. The API processes the message and returns a response.
4. QingChat displays the response in the chat interface.

## Getting Started

### Prerequisites

- A modern web browser
- An accessible conversational API endpoint (e.g. OpenAI, Grok, your own backend, etc.)

### Setup

1. **Clone this repository:**
   ```bash
   git clone https://github.com/hey-ashik/QingChat.git
   cd QingChat
   ```

2. **Open the application:**
   - Open `index.html` in your browser.

3. **Configure the API endpoint:**
   - Edit the JavaScript file (e.g., `main.js` or similar) to set your API endpoint and any required authentication.

## Example API Call

```js
fetch('https://your-api-endpoint.com/message', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    // Add authorization headers if needed
  },
  body: JSON.stringify({ message: userMessage })
})
.then(response => response.json())
.then(data => {
  // Display the response in the chat
});
```

## Customization

- **UI Styling:** Edit `style.css` for custom themes.
- **Features:** Add message history, streaming responses, markdown rendering, etc.
- **API Integration:** Adapt the API call for your backend.

## Technologies Used

- HTML
- CSS
- JavaScript

## License

This project is open source and available under the [MIT License](LICENSE).

## Author

- [hey-ashik](https://github.com/hey-ashik)
