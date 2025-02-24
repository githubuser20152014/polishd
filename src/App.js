import React, { useState, useEffect } from 'react';
import './App.css';

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
      const response = await fetch('/.netlify/functions/polish-text', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: inputText })
      });

      const data = await response.json();
      if (data.message) {
        setPolishedText(data.message);
        setEditablePolishedText(data.message);
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