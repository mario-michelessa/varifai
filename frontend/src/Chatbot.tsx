import React, { useEffect, useState, useReducer } from 'react';
// import './Chatbot.css';
import {MessageList, InputForm, DistributionTab, ImagesComponent, SessionScreen, SimpleMenu} from './components';
import {ApiGenerateResponse, ApiMessage, ButtonProps, theme, isImageData, LoadApiResponse, ApiMeasureResponse} from './types';
import { ThemeProvider, Box, Grid, Typography, styled, Chip, Button, Divider, CircularProgress, Backdrop, Fab, Menu, MenuItem, TextField} from '@mui/material';
import { useParams, useNavigate, Link } from 'react-router-dom';
import AddIcon from '@mui/icons-material/Add';
import { useAppContext } from './Context';
import { Message } from '@mui/icons-material';

const AttributeChip = styled(Chip)(({ theme }) => ({
  height: '25px', // Fixed height (optional)
  borderRadius: '10px', // Custom border radius
  display: 'flex',
  border: '0px',
  margin: '5px',
  justifyContent: 'flex-end',
  '& .MuiChip-label': {
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
  },
}));

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

const Chatbot = () => {
  const {state, dispatch, callApi} = useAppContext();
  // const { messages, lastDataset, distributions, loaded } = state;
  const [loading, setLoading] = useState(false);

  const { sessionName, sessionTab } = useParams<{ sessionName: string, sessionTab: string }>();
  const navigate = useNavigate();
  
  // useEffect(() => {
  //   console.log("Distributions: ", distributions)
  // }, [distributions]);

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

  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [inputValue, setInputValue] = useState('');
  const [suggestedAttributes, setSuggestedAttributes] = useState<string[]>([]);

  const suggestAttributes = async () => {
    const response = await callApi<ApiMessage>({
      endpoint: `suggest-attributes`,
      method: 'PUT',
      payload: {}
    });
    console.log("Response from suggestAttributes: ", response)
    
    if (typeof response.text === 'string') {
      const attributes = response.text.split(',');
      setSuggestedAttributes(attributes);
    } 
  }

  const apiAddDistribution = async (dimension:string) => {
    const response = await callApi<ApiMeasureResponse>({
      endpoint: `add-distribution/${state.sessionTab}`,
      method: 'PUT',
      payload: {dimension: dimension}
    });
    console.log("Response from addDistribution: ", response)
    dispatch({type: 'RECEIVE_MEASURE', message: response});
  }

  const handleAddDistribution = () => {
    apiAddDistribution(inputValue);
    setAnchorEl(null);
    setInputValue('');
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
      {/* {loading && (
                <Box className="spinner-container">
                  <Box className="spinner"></Box>
                </Box>
              )} */}
      <Grid container spacing={0} direction="row" sx={{  margin:theme.spacing(1),}}>
        <Grid item xs={8}>
          <Grid container spacing={0} direction="column">
            <Grid item xs={6} >
                <InputForm/>
                {state.lastDataset?.images && (
                  <ScrollableBoxH>
                    <ImagesComponent  />
                  </ScrollableBoxH>
                )}
            </Grid>

            <Divider >
              PREFERENCES
              <Fab color="primary" aria-label="add" onClick={(event) => setAnchorEl(event.currentTarget)} sx={{marginLeft:'30px', height:10, width:40}}>
                <AddIcon />
              </Fab>
              <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={() => setAnchorEl(null)}>
                {/* <MenuItem disabled>
                  <Typography variant="subtitle1">
                    Enter an attribute to measure
                  </Typography>
                </MenuItem>
                <Divider /> */}
                <MenuItem>
                  <TextField
                    autoFocus
                    fullWidth
                    margin="dense"
                    value={inputValue}
                    onChange={(event) => setInputValue(event.target.value)}
                    onKeyDown={(event) => { if (event.key === 'Enter') handleAddDistribution()} }
                    placeholder="Enter an attribute to measure"
                  />
                </MenuItem>
                <MenuItem aria-disabled>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleAddDistribution}
                  >
                    ADD
                  </Button>
                  </MenuItem>
                  <Divider /> 
                  <MenuItem aria-disabled>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={suggestAttributes}
                  >
                    SUGGEST
                  </Button>
                  {suggestedAttributes.map((attribute, index) => (
                    <AttributeChip key={index} label={attribute} onClick={() => setInputValue(attribute)}/>
                  ))}
                </MenuItem>
              </Menu>
            </Divider>

            <Grid item xs={6}>
              <DistributionTab 
                />
            </Grid>
  
          </Grid>
        </Grid>
        <Divider orientation="horizontal"/>

        <Grid item xs={4}>
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

export default Chatbot;
        
