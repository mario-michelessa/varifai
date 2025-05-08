import React, {act, useEffect, useState} from 'react';
import { Distribution } from '../types';
import Slider, { SliderThumb, SliderValueLabelProps } from '@mui/material/Slider';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import ClearIcon from '@mui/icons-material/Clear';
import MenuIcon from '@mui/icons-material/Menu';

import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';

interface MeasurePlotProps {
    // dist_id: number;
    origDistribution: Distribution;
    max: number;
}

const StyledSlider = styled(Slider)(({ theme }) => ({
    width: "80%",
    position: "relative",
    
    "& .MuiSlider-rail": {
      display:'none'
    },
    
    "& .MuiSlider-track": {
      height: 12,
      borderRadius: 1,
      color: theme.palette.primary.main,
    },
  
    '& .MuiSlider-thumb': {
      height: 20,
      width: 10,
      backgroundColor: theme.palette.primary.main,
      border: '1px solid currentColor',
      borderRadius: '10px',
    },
  
  }));

const CustomSlider = styled(Slider)(({ theme }) => ({
    width: '80%', // Customize the width here
    height: 0,
    '& .MuiSlider-thumb': {
        height: 30,
        width: 5,
        // backgroundColor: '#fff',
        backgroundColor: theme.palette.primary.main,
        // opacity: 0.5,
        // border: '2px solid currentColor',
        borderRadius: '2px', 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        '&:hover': {
            backgroundColor: theme.palette.primary.light, // Lighter shade on hover
            // boxShadow: '0 0 0 8px rgba(58, 133, 137, 0.16)',
            boxShadow: '0 0 0 8px rgba(255, 255, 255, 0.16)',
        },
        // transform: 'translateX(-20%) translateY(-50%)', // Shift the thumb to the right by half its width
    },
    '& .MuiSlider-track': {
        height: 30,
        backgroundColor: theme.palette.primary.main,
        borderRadius: 0,
    },
    '& .MuiSlider-rail': {
        height: 10,
        backgroundColor: theme.palette.primary.light,
        // borderRadius: 4,
    },
    
}));

const CustomChip = styled(Chip)(({ theme }) => ({
    // width: '100px', // Fixed width
    height: '25px', // Fixed height (optional)
    borderRadius: '10px', // Custom border radius
    // backgroundColor: theme.palette.primary.light, // Use light primary color
    // color: theme.palette.primary.contrastText, // Ensure text is readable
    display: 'flex',
    border: '0px',
    justifyContent: 'flex-end',
    // alignItems: 'center',
    '& .MuiChip-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

const MeasurePlot:React.FC<MeasurePlotProps> = ({origDistribution, max}) => {

    const [distribution, setDistribution] = useState<Distribution>(origDistribution);
    const dimension = origDistribution.dimension;

return (
    <div>   
        <Grid container spacing={0}>
            <Grid item xs={10} >
                <h5>{dimension}</h5>
            </Grid>
            <Grid item xs={2}>
            </Grid>
            {distribution.x.map((label, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={4} >
                        <div><CustomChip 
                            label={label} 
                            size='small' 
                            variant="outlined" 
                            disabled={true}
                            />
                        </div>
                        
                    </Grid>
                    <Grid item xs={8}>
                                <div
                                    style={{
                                    position: "relative",
                                    height: "30px",
                                    width: "80%",
                                    backgroundColor: "#ffffff",
                                    borderRadius: "4px",
                                    marginBottom: "-30px",
                                    // marginLeft: "23px",
                                    }}
                                >
                                    <div
                                    style={{
                                        position: "absolute",
                                        height: "100%",
                                        width: `${distribution.y[index] / max * 100}%`,
                                        // backgroundColor: "#90caf9", // Adjust color as needed
                                        backgroundColor: '#D0D3EB', // Adjust color as needed
                                        borderRadius: "4px",
                                    }}
                                    ></div>
                                </div>

                                <StyledSlider
                                    disabled={true}
                                    size="small"
                                    max={100}
                                    min={0}
                                    defaultValue={distribution.y_target[index] / max * 100}
                                />

                    </Grid>
                </React.Fragment>
            ))}
        </Grid>
        
</div>
);
};

export default MeasurePlot;
