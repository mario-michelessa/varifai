import React, {useEffect, useState} from 'react';
import { Distribution, ImageData, theme, ApiMeasureResponse } from '../types';
import Slider, { SliderThumb } from '@mui/material/Slider';

import {Chip, Grid, Menu, MenuItem, Stack, IconButton, TextField, Box, Paper, Button, ImageList, ImageListItem, ThemeProvider, Divider} from '@mui/material/';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import BalanceIcon from '@mui/icons-material/Balance';
import UndoIcon from '@mui/icons-material/Undo';

import { useTheme, styled } from '@mui/material/styles';
import CustomSlider from './CustomSlider';
import {Typography } from '@mui/joy';
import { Visibility } from '@mui/icons-material';

import { useAppContext } from '../Context';

interface MeasureProps {
    dimension: string;
};

const CustomChip = styled(Chip)(({ theme }) => ({
    height: '25px', // Fixed height (optional)
    borderRadius: '10px', // Custom border radius
    display: 'flex',
    border: '0px',
    justifyContent: 'flex-end',
    '& .MuiChip-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

const AddChip = styled(Chip)(({ theme }) => ({
    height: '25px', // Fixed height (optional)
    borderRadius: '10px', // Custom border radius
    display: 'flex',
    // border: '1px',
    borderColor: theme.palette.primary.light,
    // backgroundColor: theme.palette.primary.light,
    justifyContent: 'center',
    '& .MuiChip-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

const DimButton = styled(Button)(({ theme }) => ({
    height: '30px', // Fixed height (optional)
    margin: '5px',
    borderRadius: '10px', // Custom border radius
    fontSize: '18px',
    alignSelf: 'center',
    fontWeight: 'bold',
    display: 'flex',
    border: '0px',
    width: '100%',
    justifyContent: 'center',
    textTransform: 'capitalize',
    '& .MuiButton-label': {
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
    },
}));

const Measure:React.FC<MeasureProps> = ({dimension,
                                }) => {
    
    const theme = useTheme();

    const {state, dispatch, callApi} = useAppContext();
    const idx = state.distributions.findIndex((dist) => dist.dimension === dimension);
    const distribution = state.distributions[idx];
    
    // for balls and bins logic
    const totalBalls = state.lastDataset?.images.length || 0;
    const [bins, setBins] = useState<number[]>(distribution.y_target);

    const [dimensionLabel, setDimensionLabel] = useState<string>(dimension);

    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [inputValue, setInputValue] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null); 
    
    const handleDimSave = () => {
        if (inputValue) { 
            setDimensionLabel(inputValue);
            // changeDimension(inputValue);
        }
    }

    // distribution logic

    const deleteDistribution = async () => {
        dispatch({type: 'REMOVE_DISTRIBUTION', dimension: dimension});
        
        // also removes it in the backend
        const response = callApi({
            endpoint: `remove-distribution/${state.sessionTab}`,
            method: 'PUT',
            payload: {dimension: dimension}
        });
    }

    const apiChangeDistribution = async (newX:string[], yTarget:number[]) => {
        // call setDistribution and change the x value 
        const response = await callApi<ApiMeasureResponse>({
            endpoint: `change-distribution-x/${state.sessionTab}`,
            method: 'PUT',
            payload: {dimension:dimension, newX: newX, yTarget:yTarget}
        });
        console.log("Response from updateDistribution: ", response)
        dispatch({type: 'RECEIVE_MEASURE', message: response});
    }

    // values logic

    const deleteValue = (event:React.MouseEvent, index:number) => {
        event.preventDefault(); 
        const newX = distribution.x.filter((_, i) => i !== index);
        const newYTarget = distribution.y_target.filter((_, i) => i !== index);
        apiChangeDistribution(newX, newYTarget);
    }

    const changeValue = (value: string, index: number | null) => {
        if (index !== null) {
            const newX = [...distribution.x];
            newX[index] = value;
            apiChangeDistribution(newX, distribution.y_target);
        }   
    }
    
    const addValue = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
        setActiveIndex(distribution.x.length);
        // The actual adding is carried by changeValue
    };

    //when pressed enter or click on button or outside the menu
    const saveValue = () => {
        if (inputValue) changeValue(inputValue, activeIndex);
        closeMenu();
    };

    // menu logic
    const openMenu = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
        setAnchorEl(event.currentTarget);
        setActiveIndex(index);
    };

    // when pressed escape
    const closeMenu = () => {
        setAnchorEl(null);
        setActiveIndex(null);
        setInputValue(null);
    };
    
    const openDimMenu = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setActiveIndex(-1);
    }

    const handleOnClose = (event: React.SyntheticEvent | Event) => {
        if (event.type === 'keydown' && (event as React.KeyboardEvent).key === 'Escape') {
            closeMenu();
        } else {
            saveValue();
        }
    };    

    // slider logic

    const changeYTarget = (y_target: number[]) => {
        dispatch({type: 'UPDATE_DISTRIBUTION', dimension: dimension, distribution: {y_target: y_target}});
    }

    // balls and bins logic is here
    const handleSliderChange = (value: number | number[], index: number) => {
        const currentSum = bins.reduce((sum, v) => sum + v, 0);
        const newValue = value as number;
        // console.log("newValue", newValue);
        bins[index] = newValue;
        
        // Calculate the current total and the difference to redistribute
        let remainingDelta = totalBalls - currentSum;
        let newValues = [...bins];
        
        // Find the adjustable sliders (all except the one being changed)
        const adjustableIndexes = newValues
        .map((_, i) => (i !== index ? i : null))
        .filter((i): i is number => i !== null); 

        // Calculate the linear adjustment for each adjustable slider
        const adjustmentPerSlider = remainingDelta / adjustableIndexes.length;
        // console.log("adjustmentPerSlider", adjustmentPerSlider);
        adjustableIndexes.forEach((adjIndex) => {
            // Adjust each slider linearly, but clamp to 0 if decrementing
            newValues[adjIndex] = Math.max(0, newValues[adjIndex] + adjustmentPerSlider);
        });

        setBins(newValues);
        changeYTarget(newValues); 
    }

    const handleInputChange = (value: number, index: number) => {
        let newValue = value / 100 * totalBalls;
        handleSliderChange(newValue, index);
    }

    // brushing

    const handleBrush = (index: number) => {
        const value = index >= 0 ? distribution.x[index] : null;
        // console.log("Brushing on ", index, value);
        dispatch({type: 'UPDATE_BRUSHING', dimension: dimension, value: value});
    }

    // buttons bar logic
    const resetDistribution = () => {
        setBins(distribution.y);
        changeYTarget(distribution.y);
    }

    const equalDistribution = () => {
        const average = distribution.y.reduce((sum, value) => sum + value, 0) / distribution.y.length;
        const newYTarget = Array(distribution.x.length).fill(average);
        setBins(newYTarget);
        changeYTarget(newYTarget);
    }
    
return (
    <div>   
        <Grid container spacing={0}>
            <Grid item xs={8} >
                <div>
                    <DimButton
                        variant="outlined"
                        color="primary"
                        onClick={openDimMenu}
                        >{dimension}
                    </DimButton>
                </div>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={closeMenu}
                >
                    <MenuItem>
                        <TextField
                            autoFocus
                            fullWidth
                            margin="dense"
                            value={(inputValue === null)? dimensionLabel : inputValue}
                            onChange={(event)=> (setInputValue(event.target.value))}
                            onKeyDown={(event) => {if (event.key === 'Enter') {handleDimSave();}}}
                            placeholder="Modify Dimension Name"
                        />
                    </MenuItem>
                    <MenuItem>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleDimSave}
                    >
                        <DoneIcon />
                    </Button>
                    </MenuItem>

                </Menu>

            </Grid>
            <Grid item xs={4}>
                <Tooltip title="Balance Distribution" arrow>
                    <IconButton 
                        aria-label="balance distribution" 
                        color="primary"
                        onClick={equalDistribution} 
                        ><BalanceIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Revert Distribution" arrow>
                    <IconButton 
                        aria-label="reset distribution" 
                        color="primary"
                        onClick={resetDistribution} 
                        ><UndoIcon />
                    </IconButton>
                </Tooltip>
                <Tooltip title="Delete Distribution" arrow>
                    <IconButton 
                        aria-label="delete distribution" 
                        color="error"
                        onClick={deleteDistribution} 
                        ><ClearIcon />
                    </IconButton>
                </Tooltip>

            </Grid>
            <Grid item xs={12}>
                <Divider />
                <div style={{height: '10px'}}></div>
            </Grid>
            {distribution.x.map((label, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={3} >
                        <div>
                            <CustomChip 
                            label={label} 
                            size='small' 
                            variant="outlined" 
                            onDelete={(e) => deleteValue(e, index)} 
                            onClick={(e) => openMenu(e, index)}
                            />
                        </div>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl) && activeIndex === index}
                            onClose={handleOnClose}
                        >
                            <MenuItem>
                                <TextField
                                    autoFocus
                                    fullWidth
                                    margin="dense"
                                    value={(inputValue === null)? label : inputValue}
                                    onChange={(event)=> setInputValue(event.target.value)}
                                    onKeyDown={(event) => {if (event.key === 'Enter') {handleOnClose(event);}}}
                                    placeholder="Modify Label"
                                />
                            </MenuItem>
                            <MenuItem>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={saveValue}
                            >
                                <DoneIcon />
                            </Button>
                            </MenuItem>

                        </Menu>
                    </Grid>
                    <Grid item xs={9}>
                        <CustomSlider
                            key={`${index}`} 
                            baseValue={distribution.y[index]}
                            v={distribution.y_target[index]}
                            max={totalBalls || 0}
                            min={0}
                            // onChangeCommitted={}
                            onChange={(v) => handleSliderChange(v, index)}
                            onChangeInput={(v) => handleInputChange(v, index)}
                            onHoverStart={() => handleBrush(index)}
                            onHoverEnd={() => handleBrush(-1)}
                            />
                    </Grid>
                </React.Fragment>
            ))}
            <Grid item xs={0.5} >
            </Grid>

            <Grid item xs={2.5} >
                <Tooltip title="Add New Category"><AddChip icon={<AddIcon/>} label="Add" variant="outlined" onClick={(e)=>addValue(e)} /></Tooltip>
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl) && activeIndex === distribution.x.length}
                    onClose={handleOnClose}
                    >
                    <MenuItem>
                        <TextField
                            autoFocus
                            fullWidth
                            margin="dense"
                            value={inputValue}
                            onChange={(event)=> setInputValue(event.target.value)}
                            onKeyDown={(event) => {if (event.key === 'Enter') {handleOnClose(event);}}}
                            placeholder="Enter New word"
                            />
                    </MenuItem>
                </Menu>
            </Grid>
            <Grid item xs >
            </Grid>
            <Grid item xs={1.5} >
            </Grid>
        </Grid>
    </div>
);

};
export default Measure;

