

// App.js
import React from 'react';
import Chatbot from './Chatbot';
import ChatbotBase from './ChatbotBase';
import SessionScreen from './components/SessionScreen';
import { BrowserRouter as Router, Route, Routes, useLocation} from 'react-router-dom';

const DebugComponent = () => {
  const location = useLocation();
  console.log("Current path:", location.pathname);
  return null;
};

const App = () => {
  return (
    <Router>
      {/* <DebugComponent /> */}
      <Routes>
        <Route path="/" element={<SessionScreen />} />
        <Route path="/C1/:sessionName/:sessionTab" element={<Chatbot />} />
        <Route path="/C2/:sessionName/:sessionTab" element={<ChatbotBase />} />
        <Route path="*" element={<div>404 Not Found</div>} />
      </Routes>
    </Router>
  );
};

export default App;
