import React, { useState, useEffect } from 'react';
import './App.css';
import { OPENAI_API_KEY, API_ENDPOINT } from './config';

function App() {
  const [inputText, setInputText] = useState('');
  const [polishedText, setPolishedText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [editablePolishedText, setEditablePolishedText] = useState('');

  useEffect(() => {
    // Initialize speech recognition
    if (window.SpeechRecognition || window.webkitSpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = true;
      recognitionInstance.interimResults = true;
      
      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
          }
        }
        if (finalTranscript) {
          setInputText(prev => prev + finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      setRecognition(recognitionInstance);
    } else {
      console.error('Speech recognition not supported in this browser');
    }
  }, []);

  const toggleListening = () => {
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
    setIsListening(!isListening);
  };

  const handleGenerate = async () => {
    if (!inputText.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const response = await fetch(API_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [{
            role: "system",
            content: `You are a professional editor who specializes in concise, friendly-professional communication. Format the input text into an email:
            1. Start with "Subject: " followed by a brief, clear subject line
            2. Add TWO line breaks after the subject line
            3. Keep the message concise and conversational yet professional
            4. Remove any unnecessary formalities or redundant phrases
            5. Maintain the core message and intent`
          }, {
            role: "user",
            content: inputText
          }],
          temperature: 0.7
        })
      });

      const data = await response.json();
      if (data.choices && data.choices[0]) {
        const generatedText = data.choices[0].message.content;
        setPolishedText(generatedText);
        setEditablePolishedText(generatedText);
      }
    } catch (error) {
      console.error('Error generating polished text:', error);
      setPolishedText('Error generating polished text. Please try again.');
      setEditablePolishedText('Error generating polished text. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClear = () => {
    setInputText('');
    setEditablePolishedText('');
    setPolishedText('');
  };

  return (
    <div className="App">
      <div className="app-header">
        <h1>Polishd</h1>
        <p>Voice to Professional Text</p>
      </div>
      <div className="container">
        <div className="input-section">
          <h2>Go ahead and dictate your message...</h2>
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Your dictated message will appear here..."
          />
          <button 
            onClick={toggleListening} 
            className={`mic-button ${isListening ? 'active' : ''}`}
          >
            🎤
          </button>
          <button 
            onClick={handleClear}
            className="clear-button"
          >
            Clear
          </button>
        </div>
        
        <div className="output-section">
          <button 
            onClick={handleGenerate} 
            className={`generate-button ${isGenerating ? 'generating' : ''}`}
            disabled={isGenerating}
          >
            {isGenerating ? 'Generating...' : 'Generate'}
          </button>
          <textarea
            value={editablePolishedText}
            onChange={(e) => setEditablePolishedText(e.target.value)}
            className="polished-text editable"
            placeholder="polished message appears here..."
          />
        </div>
      </div>
    </div>
  );
}

export default App; 