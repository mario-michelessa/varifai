import React, { useState, FormEvent } from 'react';
import {TextField, Button, Grid, FormControl, FormHelperText, OutlinedInput, InputLabel, Slider, Typography, Input, InputAdornment} from '@mui/material';
import { useAppContext } from '../Context';
import { ApiGenerateResponse, ApiMessage } from '../types';
interface InputFormProps {
}

const InputForm: React.FC<InputFormProps> = ({}) => {
  const [input, setInput] = useState<string>('');
  const [nImages, setNImages] = useState<number>(10);
  const min = 10;
  const max = 100;
  const {state, dispatch, callApi} = useAppContext();

  const apiGenerate = async (message_str:string) => {

    let newMessage:ApiMessage = {type:"message", text: "an image of " + message_str, sender: 'user', data: null}
    dispatch({type: 'RECEIVE_MESSAGE', message: newMessage});

    // console.log(newMessage);
    
    const message = await callApi<ApiGenerateResponse>({
      endpoint: `generate/${state.sessionTab}`,
      method: 'PUT',
      payload: {"text": "an image of " + message_str, "distributions": state.distributions}
    });
    
    dispatch({type: 'RECEIVE_GENERATE', message: message});
    // receiveMessage(message);
  
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    apiGenerate(input + '@' + nImages.toString());
    // setInput('');
  };
  
  const marks = [
    {
      value: 10,
      label: '10',
    },
    {
      value: 50,
      label: '50',
    },
    {
      value: 100,
      label: '100',
    },
  ]; 
  return (
    <Grid container spacing={2} direction="row" alignItems="center">
      <Grid item xs={8}>
      <FormControl fullWidth sx={{marginRight:1, marginTop:1}}>
          <InputLabel htmlFor="component-helper">An image of ...</InputLabel>
          <OutlinedInput
            // id="component-helper"
            // defaultValue="Enter the image prompt..."
            placeholder='a realistic doctor..., a beautiful plant...'
            value={input}
            onChange={(e) => setInput(e.target.value)}
            label="Dataset Prompt"
            // aria-describedby="component-helper-text"
          />
          <FormHelperText id="component-helper-text">
            Write the description of the image you want to generate here. ex: "A photo of a doctor..."
          </FormHelperText>
        </FormControl>
      </Grid>
      <Grid item xs={1}>
        <Typography id="discrete-slider" gutterBottom>
            How many?
        </Typography>
        <Slider 
            defaultValue={nImages}
            aria-labelledby="discrete-slider"
            valueLabelDisplay="auto"
            step={5}
            marks={marks}
            min={min}
            max={max}
            value={nImages}
            onChange={(e, value) => setNImages(value as number)}
          />
      </Grid>
      <Grid item xs={0.7}>
        <Input
            value={nImages}
            margin="dense"
            onChange={(e) => {
              let n = Number(e.target.value);
              if (Number.isNaN(n)) n = nImages;
              // if (n < min) n = min;
              if (n > max) n = max;
              setNImages(n);
              }}
            inputProps={{
              min,
              max,
              type: 'number',
            }}
            endAdornment={
              <InputAdornment position="end">images</InputAdornment>
            }
            sx={{
              'input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button': {
                WebkitAppearance: 'none', // For Chrome, Safari, and Edge
                margin: 0,
              },
            }}

        />
      </Grid>

      <Grid item xs={2}>
      <Button variant="contained" onClick={handleSubmit} sx={{margin:1, marginBottom:3}}>
          Generate
        </Button>
      </Grid>
    </Grid>
  );
};

export default InputForm;
