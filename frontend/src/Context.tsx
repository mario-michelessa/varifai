import React, { createContext, useReducer, useContext, ReactNode, act } from 'react';
import {Message, isImageData, Distribution, isDistribution, ImageData, ApiCallProps, ButtonProps, theme, ApiGenerateResponse, ApiCallResponse, ApiMessage, ApiMeasureResponse} from './types';
import { Link } from 'react-router-dom';

type AppState = {
    messages: Message[];
    lastDataset: ImageData | null;
    distributions: Distribution[];
    labels: string[][]; // labels[i] contains labels of image i
    highlightedIndices: number[];
    loading: boolean;
    loaded: boolean;
    sessionName: string,
    sessionTab: string,
  };
  
  const initialState: AppState = {
    messages: [],
    lastDataset: null,
    distributions: [],
    labels: [[]],
    highlightedIndices: [],
    loading: false,
    loaded: false,
    sessionName: '',
    sessionTab: '',
  };
  

  const generateLink = (input: string | JSX.Element, sessionName:string) => {
    const regex = /#(\d+)/;
    if (typeof input !== 'string') {
      return input;
    }
    const match = input.match(regex);
    if (match) {
      const newTab = match[1];
      const newUrl = `/${sessionName}/${newTab}`;
      const parts = input.split(regex);

      return (
        <span>
          {parts[0]}
          <span style={{ color: 'blue', textDecoration: 'underline', cursor: 'pointer' }}>Go back to the previous state</span>
          {parts[2]}
        </span>
      );
      // return (
      //   <span>
      //     {parts[0]}
      //     <Link to={newUrl}> Go back to the previous state </Link>
      //     {parts[2]}
      //   </span>
      // );
    }

    return <span>input</span>;
  };

  type AppAction =
    | { type: 'CHANGE_SESSION'; messages:Message[], dataset: ImageData | null, sessionName: string, sessionTab: string }
    | { type: 'RECEIVE_MESSAGE'; message: ApiMessage }
    | { type: 'RECEIVE_GENERATE'; message: ApiGenerateResponse }
    | { type: 'RECEIVE_MEASURE'; message: ApiMeasureResponse }
    | { type: 'REMOVE_DISTRIBUTION'; dimension: string }
    | { type: 'UPDATE_DISTRIBUTION'; dimension: string; distribution: Partial<Distribution> }
    | { type: 'UPDATE_BRUSHING'; dimension: string; value: string | null }
    // | { type: 'CHANGE_DIMENSION'; index: number; dimension: string }
    | { type: 'SET_LOADING'; loading: boolean }
    | { type: 'RESET'; };

function AppReducer(state: AppState, action: AppAction): AppState {
    switch (action.type) {

    case 'CHANGE_SESSION': {
      const newMessages = action.messages;
      newMessages.forEach((message) => ({...message, text: generateLink(message.text, action.sessionName)}));

      if (isImageData(action.dataset)) {
        //add distributions all at once
        const distributions = action.dataset.distributions.map((d, _) => ({dimension: d.dimension, x: d.x, y: d.y.map(Number), y_target: d.y_target.map(Number), labels: []}))
        
        let labels = action.dataset.labels;
        labels = labels.map(labelArray => labelArray.slice(1)); // remove the alignment label

        return { ...state, messages: action.messages, lastDataset: action.dataset, loaded: true, distributions: distributions, sessionName: action.sessionName, sessionTab: action.sessionTab, labels: labels};
      }
      return { ...state, messages: newMessages, lastDataset: null, loaded: true, distributions: [], sessionName: action.sessionName, sessionTab: action.sessionTab };
    }
    case 'RECEIVE_MESSAGE':
      if (action.message.sender === 'user' && typeof action.message.text === 'string') {
        action.message.text = action.message.text.split('@')[0];
      }
      return { ...state, messages: [...state.messages, action.message] };
    
    case 'RECEIVE_GENERATE': { 
      const distributions = action.message.data.distributions.map((d, _) => ({dimension: d.dimension, x: d.x, y: d.y.map(Number), y_target: d.y_target.map(Number), labels: []}))
      
      let labels_generate = action.message.data.labels;
      // labels_generate = labels_generate.map(labelArray => labelArray.slice(1)); // remove the alignment label
      
      return { ...state, lastDataset: action.message.data, messages: [...state.messages, {...action.message, text:generateLink(action.message.text, state.sessionName)}], distributions: distributions, labels: labels_generate };
    }
    case 'RECEIVE_MEASURE': {
      console.log("Received measure: ", action.message.data);
      const distribution = {dimension: action.message.data.dimension, x: action.message.data.x, y: action.message.data.y.map(Number), y_target: action.message.data.y_target.map(Number).slice(0, action.message.data.x.length), labels: action.message.data.labels};
      const dim_idx = state.distributions.findIndex(d => d.dimension === action.message.data.dimension);
      
      if (dim_idx >= 0) {
        console.log("Updating distribution: ", distribution);
        const newDistributions = state.distributions.map((d, i) => i === dim_idx ? distribution : d);
        const labels_update = state.labels.map((labels_im, id_im) => 
          labels_im.map((label, id_dim) => 
            (id_dim === dim_idx && action.message.data.labels.length > id_im) ? action.message.data.labels[id_im] : label // update the label if it exists
          )
        );
        return { ...state, messages: [...state.messages, action.message], distributions: newDistributions, labels: labels_update };
      }
      else {
        console.log("Adding distribution: ", distribution);
        const newDistributions = [...state.distributions, distribution];
        const labels_update = state.labels.map((labels_im, id_im) => {
          const newLabels = [...labels_im];
          newLabels.push(distribution.labels[id_im]);
          return newLabels;
        });
        return { ...state, messages: [...state.messages, action.message], distributions: newDistributions, labels: labels_update };
      }
    }
    case 'SET_LOADING':
      return { ...state, loading: action.loading };
      
    case 'REMOVE_DISTRIBUTION':{
      const dim_id = state.distributions.findIndex(d => d.dimension == action.dimension);
      console.log("Removing distribution: ", action.dimension, dim_id);
      return { 
      ...state, 
      distributions: state.distributions.filter((d, i) => d.dimension !== action.dimension),
      labels: state.labels.map(labelArray => labelArray.filter((_, i) => i !== dim_id))
      };
    }
    case 'UPDATE_DISTRIBUTION': {
      const dim_idx = state.distributions.findIndex(d => d.dimension == action.dimension);
      
      if (action.distribution.labels && action.distribution.labels.length > 0) {
        return {
          ...state,
          distributions: state.distributions.map((d, i) =>
            i === dim_idx ? { ...d, ...action.distribution } : d),
          labels: state.labels.map((labels_im, id_im) =>
            labels_im.map((label, id_dim) =>
            (id_dim === dim_idx && action.distribution.labels && action.distribution.labels.length > id_im) ? action.distribution.labels[id_im] : label)
          )
        };
      } 
      else {
        return {
          ...state,
          distributions: state.distributions.map((d, i) =>
            i === dim_idx ? { ...d, ...action.distribution } : d
          ),
        };
      }
    }
    case 'UPDATE_BRUSHING': {
      const value = action.value;
      if (!value) {
        return {...state, highlightedIndices: []};
      }
      else { 
        const dim_idx = state.distributions.findIndex(d => d.dimension == action.dimension);
        const highlightedIndices = state.labels.map((labelArray, i) => labelArray[dim_idx] === action.dimension + " " + value ? i : -1).filter(i => i >= 0);
        console.log("Highlighting: ", action.dimension, value, dim_idx, highlightedIndices, state.labels);
        return {...state, highlightedIndices: highlightedIndices};
      }
    }
    case 'RESET':
        return initialState;

    default:
        return state;
    }
}

// Define context types
type AppContextType = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  callApi:  <T>(props: ApiCallProps) => Promise<T>;
};

// Create context
const AppContext = createContext<AppContextType | undefined>(undefined);

// Context provider component
export const AppProvider = ({ children }: { children: ReactNode }) => {
    const [state, dispatch] = useReducer(AppReducer, initialState);

    // can put the api calls here 
    async function callApi<T>({ endpoint, method, payload }: ApiCallProps):Promise<T> {
        console.log("calling api: ", `${process.env.REACT_APP_API_URL}/api/${endpoint}`)
        try {
            dispatch({ type: 'SET_LOADING', loading: true });
            const response = await fetch(`${process.env.REACT_APP_API_URL}/api/${endpoint}`, {
            method: method,
            headers: {
            'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });
        const data = await response.json();
        console.log('Success:', data);
        return data;
        } catch (error) {
        console.error('Error:', error);
        throw error;  // Rethrowing the error to handle it specifically in the calling function if needed
        } finally {
        dispatch({ type: 'SET_LOADING', loading: false });
        }
    }
    
    return (
        <AppContext.Provider value={{ state, dispatch, callApi }}>
            {children}
        </AppContext.Provider>
    );
};

// Custom hook for accessing the context
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within a AppProvider');
  }
  return context;
};
export default AppProvider;
