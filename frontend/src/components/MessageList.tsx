import React from 'react';
import MessageItem from './MessageItem';
import { Message } from '../types';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useAppContext } from '../Context';

import Timeline from '@mui/lab/Timeline';
import TimelineItem, { timelineItemClasses } from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';

interface MessageListProps {
  // messages: Message[];
}

const MessageList: React.FC<MessageListProps> = ({}) => {
  // console.log("messages: ", messages);
  const {state} = useAppContext();
  const messages_to_show = state.messages.filter((message) => (message.type == "generate" || message.sender == "user"));
  return (
    <Timeline
    sx={{
      [`& .${timelineItemClasses.root}:before`]: {
        flex: 0,
        padding: 0,
      },
    }}
  >
       {messages_to_show.map((message, index) => (
        <React.Fragment key={index}>
          <TimelineItem> 
            <TimelineSeparator><TimelineDot /><TimelineConnector /></TimelineSeparator>
            <TimelineContent>
              <MessageItem key={index} message={message} />
            </TimelineContent>
          </TimelineItem>
        </React.Fragment>
       ))}
        <TimelineItem>
          <TimelineSeparator><TimelineDot color="primary" /></TimelineSeparator>
          <TimelineContent>
            <Typography variant="body2" color="textSecondary">------ Newest -----</Typography>
          </TimelineContent>
        </TimelineItem>

    </Timeline>
  );
};

export default MessageList;
