import React, {useEffect, useState} from 'react';
import { Distribution, ImageData } from '../types';
import Slider, { SliderThumb } from '@mui/material/Slider';

import {Chip, Grid, Menu, MenuItem, Stack, IconButton, TextField, Box, Paper, Button, ImageList, ImageListItem} from '@mui/material/';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';

import MenuIcon from '@mui/icons-material/Menu';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import DoneIcon from '@mui/icons-material/Done';
import BalanceIcon from '@mui/icons-material/Balance';
import UndoIcon from '@mui/icons-material/Undo';
import VisibilityIcon from '@mui/icons-material/Visibility';

import { useTheme, styled } from '@mui/material/styles';
import CustomSlider from './CustomSlider';
import { Typography } from '@mui/joy';
import { Visibility } from '@mui/icons-material';

interface MeasureProps {
    origDistribution: Distribution; 
    changeDistributionX: (dimension:string, newX:string[], yTarget:number[]) => void;
    changeDistributionYTarget: (dimension: string, newYtarget: number[]) => void;
    deleteDistribution: () => void;
    lastDataset: ImageData | null;
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

const Measure:React.FC<MeasureProps> = ({origDistribution, 
                                    changeDistributionX, 
                                    changeDistributionYTarget, 
                                    deleteDistribution, 
                                    lastDataset}) => {
    
    const theme = useTheme();

    const [distribution, setDistribution] = useState<Distribution>(origDistribution);
    const [sortedImages, setSortedImages] = useState<string[][]>([]);
    
    const dimension = origDistribution.dimension;

    const HtmlTooltip = styled(({ className, ...props }: TooltipProps) => (
        <Tooltip {...props} classes={{ popper: className }} />
      ))(({ theme }) => ({
        [`& .${tooltipClasses.tooltip}`]: {
          backgroundColor: '#f5f5f9',
          color: 'rgba(0, 0, 0, 0.87)',
          maxWidth: 220,
          fontSize: theme.typography.pxToRem(12),
          border: '1px solid #dadde9',
        },
      }));
      
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [inputValue, setInputValue] = useState<string | null>(null);
    const [activeIndex, setActiveIndex] = useState<number | null>(null);

    const deleteLabel = (event:React.MouseEvent, index:number) => {
        event.preventDefault(); 
        const newX = distribution.x.filter((_, i) => i !== index);
        const newYTarget = distribution.y_target.filter((_, i) => i !== index);
        changeDistributionX(dimension, newX, newYTarget);
        setDistribution(prevDistribution => ({...prevDistribution, x: newX}));
        }

    const addLabel = (event: React.MouseEvent<HTMLDivElement>) => {
        setAnchorEl(event.currentTarget);
        setActiveIndex(distribution.x.length);

        // The actual adding is carried by changeValue
    };

    const openMenu = (event: React.MouseEvent<HTMLDivElement>, index: number) => {
        setAnchorEl(event.currentTarget);
        setActiveIndex(index);
    };

    const changeLabel = (value: string, index: number | null) => {
        if (index !== null) {
            const newX = [...distribution.x];
            newX[index] = value;
            changeDistributionX(dimension, newX, distribution.y_target);
            setDistribution(prevDistribution => ({...prevDistribution, x: newX}));
        }   
    }

    // when pressed escape
    const closeMenu = () => {
        setAnchorEl(null);
        setActiveIndex(null);
        setInputValue(null);

    };

    //when pressed enter or click on button or outside the menu
    const saveLabel = () => {
        if (inputValue) changeLabel(inputValue, activeIndex);
        closeMenu();
    }

    const handleSliderChange = (value: number | number[], index: number) => {
        const newYTarget = [...distribution.y_target];
        newYTarget[index] = value as number;
        setDistribution(prevDistribution => ({...prevDistribution, y_target: newYTarget}));
    }

    const handleSliderChangeCommitted = () => {
        // handleSliderChange(value, index);
        changeDistributionYTarget(dimension, distribution.y_target);
    }
    const handleInputChange = (value: number, index: number) => {
        const newYTarget = [...distribution.y_target];
        newYTarget[index] = value as number;
        setDistribution(prevDistribution => ({...prevDistribution, y_target: newYTarget}));
        changeDistributionYTarget(dimension, newYTarget); // distribution.y_target is not updated directly
    }

const [resetKey, setResetKey] = useState(0);
const resetDistribution = () => {
    setDistribution(prevDistribution => ({...prevDistribution, y_target: prevDistribution.y}));
    changeDistributionYTarget(dimension, distribution.y);
    setResetKey(prevKey => prevKey + 1); // Change the key to force re-render
}

const equalDistribution = () => {
    const average = distribution.y.reduce((sum, value) => sum + value, 0) / distribution.y.length;
    const newYTarget = Array(distribution.x.length).fill(average);
    setDistribution(prevDistribution => ({...prevDistribution, y_target: newYTarget}));
    changeDistributionYTarget(dimension, newYTarget);
    setResetKey(prevKey => prevKey + 1); // Change the key to force re-render
}


const handleOnClose = (event: React.SyntheticEvent | Event) => {
    if (event.type === 'keydown' && (event as React.KeyboardEvent).key === 'Escape') {
        closeMenu();
    } else {
        saveLabel();
    }
};

return (
    <div>   
        <Grid container spacing={0}>
            <Grid item xs={8} >
                <h3>{dimension}</h3>
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
            {distribution.x.map((label, index) => (
                <React.Fragment key={index}>
                    <Grid item xs={4} >
                        <div>
                            <CustomChip 
                            label={label} 
                            size='small' 
                            variant="outlined" 
                            onDelete={(e) => deleteLabel(e, index)} 
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
                                onClick={saveLabel}
                            >
                                <DoneIcon />
                            </Button>
                            </MenuItem>

                        </Menu>
                    </Grid>
                    <Grid item xs={8}>

                        <CustomSlider
                            key={`${resetKey}-${index}`} 
                            baseValue={distribution.y[index]}
                            v={distribution.y_target[index]}
                            max={lastDataset?.images.length || 0}
                            min={0}
                            // onChangeCommitted={() => handleSliderChangeCommitted()}
                            onChange={(v) => handleSliderChange(v, index)}
                            onChangeInput={(v) => handleInputChange(v, index)}
                            />
                    </Grid>
                </React.Fragment>
            ))}
            <Grid item xs={4} >
                <Tooltip title="Add New Category"><CustomChip icon={<AddIcon/>} label="" variant="outlined" onClick={(e)=>addLabel(e)} /></Tooltip>
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
        </Grid>
    </div>
);

};
export default Measure;

