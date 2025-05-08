import React, { useEffect, useState, useReducer } from 'react';
// import './Chatbot.css';
import {MessageList, InputForm, DistributionTab, ImagesComponent, SessionScreen, SimpleMenu} from './components';
import {ApiGenerateResponse, ApiMessage, ButtonProps, theme, isImageData, LoadApiResponse, ApiMeasureResponse} from './types';
import { ThemeProvider, Box, Grid, Typography, styled, Chip, Button, Divider, CircularProgress, Backdrop, Fab, Menu, MenuItem, TextField} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAppContext } from './Context';

const ScrollableBoxV = styled(Box)(({ theme }) => ({
  height: 'calc(100vh - 150px)',
  overflowY: 'auto',
  scrollbarWidth: 'none', // Hide scrollbar for non-WebKit browsers
  '&::-webkit-scrollbar': {
    display: 'none', // Hide scrollbar for WebKit browsers
  },
  '&:hover': {
    // scrollbarWidth: 'thin', // Show scrollbar on hover for non-WebKit browsers
    '&::-webkit-scrollbar': {
      display: 'block', // Show scrollbar on hover for WebKit browsers
      width: '0.1em', // Adjust width if needed
    },
    '&::-webkit-scrollbar-thumb': {
      backgroundColor: theme.palette.primary.main, // Customize scrollbar thumb color
      borderRadius: '0px',
    },
  },
}));

const ScrollableBoxH = styled(Box)(({ theme }) => ({
  width: '100%',
  overflowX: 'auto',
  scrollbarWidth: 'none', // Hide scrollbar for non-WebKit browsers
  '&::-webkit-scrollbar': {
    display: 'none', // Hide scrollbar for WebKit browsers
  },
  '&:hover': {
    scrollbarWidth: 'thin', // Show scrollbar on hover for non-WebKit browsers
    '&::-webkit-scrollbar': {
      display: 'absolute', // Show scrollbar on hover for WebKit browsers
      height: '0.2em', // Adjust height for horizontal scrollbars
      top : '-0.2em',
    },
    // '&::-webkit-scrollbar-thumb': {
    //   backgroundColor: theme.palette.primary.main, // Customize scrollbar thumb color
    //   borderRadius: '4px',
    // },
  },
}));

const ChatbotBase = () => {
  const {state, dispatch, callApi} = useAppContext();

  const { sessionName, sessionTab } = useParams<{ sessionName: string, sessionTab: string }>();
  const navigate = useNavigate();
  
  const apiLoad = async (sessionName:string, sessionTab:string) => {
    // cleanInterface()
    const response = await callApi<LoadApiResponse>({
      endpoint: `load/${sessionTab}`,
      method: 'PUT',
      payload: {sessionName: sessionName}
    });
    const messages = response.messages;
    const lastDataset = response.lastDataset;

    dispatch({type: 'CHANGE_SESSION', messages: messages, dataset:lastDataset, sessionName: sessionName, sessionTab: sessionTab});        
  };

  useEffect(() => {
    const fChangeSession = async () => {
      dispatch({type: 'SET_LOADING', loading: false});
      if (sessionName && sessionTab && !state.loaded) {
        console.log("Loading session: ", sessionName, sessionTab);
        apiLoad(sessionName, sessionTab);
        // setLoaded(true);
      }
    };
    fChangeSession();
  }, []);
  
  const cleanInterface = async () => {
    dispatch({type: 'RESET'});
  };

  const exitSession = () => {
    navigate('/');
  }

  const buttons: ButtonProps[] = [
    // { label: 'Save', action: apiSave },
    { label: 'Change Task', action: exitSession },
    { label: 'Clean Interface', action: cleanInterface},
  ];
  
  return (
    <ThemeProvider theme={theme}>
      <SimpleMenu buttons={buttons} />
      <Grid container spacing={0} direction="row" sx={{  margin:theme.spacing(1),}}>
        <Grid item xs={9}>
          <Grid container spacing={0} direction="column">
            <Grid item xs={6} >
                <InputForm/>
                {state.lastDataset?.images && (
                  <ScrollableBoxH>
                    <ImagesComponent  />
                  </ScrollableBoxH>
                )}
            </Grid>
          </Grid>
        </Grid>
        <Divider orientation="horizontal"/>

        <Grid item xs={3}>
          <Divider>
            ACTION HISTORY
          </Divider>
          <ScrollableBoxV>
            <MessageList />
          </ScrollableBoxV>
        </Grid>
      </Grid>
      <Backdrop sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }} open={state.loading} onClick={() => dispatch({type:"SET_LOADING", loading:false})}>
        <CircularProgress color="inherit" />
      </Backdrop>
    </ThemeProvider>
  )
};

export default ChatbotBase;
        
