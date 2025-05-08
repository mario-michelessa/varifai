import React, { useState } from 'react';

// import './DistributionTab.css';
import Measure from './MeasureBnB';
import { Distribution, ImageData } from '../types';
import styled from '@mui/material/styles/styled';
import { Fab, Menu, MenuItem, TextField, Typography, Paper, Stack, Button, Divider, Grid, Box } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useAppContext } from '../Context';

const ScrollableBoxH = styled(Box)(({ theme }) => ({
  width: 'calc(66vw)',
  overflowX: 'auto',
}));

interface DistributionTabProps {
}

const Item = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  ...theme.typography.body2,
  padding: theme.spacing(1),
  textAlign: 'center',
  color: theme.palette.text.secondary,
  minWidth: '400px',
  maxWidth: '400px',
}));

const DistributionTab: React.FC<DistributionTabProps>  = ({ 
  }) => {

  const {state} = useAppContext();
  const { distributions, lastDataset } = state;

  return (
    <Grid container spacing={0} direction="column" alignItems="center">
      <Grid item xs={11}>
        <ScrollableBoxH>
          <Stack spacing={2} direction="row" >

            {distributions.map((distribution, index) => (
              // <>
                    <Item key={index}>
                    <Measure 
                      dimension = {distribution.dimension}
                    />
                    </Item>
                  // </>   
            ))}
          </Stack>

        </ScrollableBoxH>
      </Grid>
      <Grid item xs={1}>
        <Typography variant="body2" gutterBottom sx={{'bottom': 0}}>
          {/* The system might not satisfy all the preferences entered. */}
        </Typography>
      </Grid>
  </Grid>
  );
};
export default DistributionTab;
