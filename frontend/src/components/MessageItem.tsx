import React from 'react';
import ImageMessage from './ImagesMessage';
import { Message, isImageData, isDistribution } from '../types';
import { Box, Typography, Stack, Button } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import { styled } from '@mui/material/styles';
import MeasurePlot from './MeasurePlot';
import { saveAs } from 'file-saver';
import JSZip from 'jszip';

interface MessageItemProps {
  message: Message;
}

interface CustomBoxProps {
  sender: 'bot' | 'user';
}

const MessageContainer = styled(Box)<CustomBoxProps>(({ theme, sender }) => ({
  display: 'flex',
  alignItems: 'center',
  backgroundColor: sender === 'bot' ? 'white' : theme.palette.primary.main,
  color: sender === 'bot' ? 'black' : 'white',
  backgroundOpacity: sender === 'bot' ? 0.1 : 1,
  marginBottom: '2px',
  padding: '15px',
  borderRadius: '12px',
  maxWidth: '90%', 
  wordWrap: 'break-word', 

}));

const MessageItem: React.FC<MessageItemProps> = ({ message }) => {
  const messageClass = message.sender === 'bot' ? 'bot-message' : 'user-message';

  const downloadImages = () => {
    if (!isImageData(message.data)) {
      return;
    }
    const zip = new JSZip();
    message.data.images.forEach((img, index) => {
      const base64Data = img.replace(/^data:image\/\w+;base64,/, '');
      zip.file(`image${index + 1}.png`, base64Data, { base64: true });
    });
  
    zip.generateAsync({ type: 'blob' }).then((content) => {
      saveAs(content, 'images.zip');
    });
  };
  

  const renderImages = () => {
    return (message.type=="generate" && 
    <>
      <ImageMessage imageData={message.data}/> 
      <Button variant="outlined" color="primary" onClick={downloadImages} startIcon={<DownloadIcon/>} >Download</Button>
    </>
    );
  };

  return (
    <MessageContainer sender={message.sender as 'bot' | 'user'} className={messageClass}>
      <Stack direction="column" spacing={2}>
        <Typography variant="body1">
          {message.text}
        </Typography>
        {renderImages()}
        {/* {renderDistribution()} */}
      </Stack>
    </MessageContainer>
  );
};

export default MessageItem;
