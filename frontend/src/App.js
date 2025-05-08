

import React from 'react';
import Chatbot from './Chatbot';
import ChatbotBase from './ChatbotBase';
import SessionScreen from './components/SessionScreen';
import { BrowserRouter as Router, Route, Routes, } from 'react-router-dom';

const App = () => {
  return (
      <Routes>
        <Route path="/" element={<SessionScreen />} />
        <Route path="C1/:sessionName/:sessionTab" element={<Chatbot />} />
        <Route path="C2/:sessionName/:sessionTab" element={<ChatbotBase />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
  );
};

export default App;
