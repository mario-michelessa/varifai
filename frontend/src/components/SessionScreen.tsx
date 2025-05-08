import React, { useState, KeyboardEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TextField, Radio, RadioGroup, FormControlLabel, Button, Container } from '@mui/material';

const SessionScreen: React.FC = () => {
  const [sessionName, setSessionName] = useState<string>('');
  const navigate = useNavigate();
  const [condition, setCondition] = useState<string>('C1');

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      startSession();
    }
  };

  const startSession = () => {
    console.log("Starting session with name: ", sessionName, " and condition: ", condition);
    if (sessionName) {
        navigate(`/${condition}/${sessionName}/0`);
    }
  };

return (
  <Container className="session-container" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
    <TextField
      label="Enter Session Name"
      variant="outlined"
      value={sessionName}
      onChange={(e) => setSessionName(e.target.value)}
      onKeyDown={handleKeyDown}
      className="session-input"
      fullWidth
      margin="normal"
    />
    <RadioGroup
      row
      name="sessionType"
      value={condition}
      onChange={(e) => setCondition(e.target.value)}
      className="radio-buttons"
    >
      <FormControlLabel value="C1" control={<Radio />} label="C1" />
      <FormControlLabel value="C2" control={<Radio />} label="C2" />
    </RadioGroup>
    <Button
      variant="contained"
      color="primary"
      onClick={startSession}
      className="session-button"
    >
      Start Session
    </Button>
  </Container>
);
}
export default SessionScreen;