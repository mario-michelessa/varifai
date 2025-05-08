import React from "react";
import { Grid, Slider, Input, InputAdornment } from "@mui/material";
import { styled } from "@mui/material/styles";
import { display } from "html2canvas/dist/types/css/property-descriptors/display";

interface StyledSliderProps {
  baseValue: number;
}

const StyledSlider = styled(Slider)<StyledSliderProps>(({ theme, baseValue }) => ({
  width: "80%",
  position: "relative",
  
  "& .MuiSlider-rail": {
    // height: 10,
    // // background: `linear-gradient(to right, ${theme.palette.primary.light} ${baseValue}%, #ffffff ${baseValue}%)`,
    // background: theme.palette.primary.main,
    // borderRadius: 1,
    display:'none'
  },
  
  "& .MuiSlider-track": {
    height: 12,
    borderRadius: 1,
    color: theme.palette.primary.main,
  },

  '& .MuiSlider-thumb:hover': {
    height: 30,
    width: 30,
    backgroundColor: '#fff',
    border: '1px solid currentColor',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  '& .MuiSlider-thumb': {
    height: 30,
    width: 10,
    backgroundColor: '#fff',
    border: '1px solid currentColor',
    borderRadius: '10px',
  },

}));

interface DeviationSliderProps {
  baseValue: number;
  min: number;
  max: number;
  v: number;
  onChange: (value: number) => void;
  onChangeInput: (value: number) => void;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;

}

const CustomSlider: React.FC<DeviationSliderProps> = ({
  baseValue,
  min,
  max,
  v,
  onChange,
  onChangeInput,
  onHoverStart,
  onHoverEnd,

}) => {
  return (
    <>
      <Grid container spacing={1} alignItems="center">
        <Grid item xs>
          {/* Rectangle to represent the range from 0 to baseValue */}
          <div
            style={{
              position: "relative",
              height: "30px",
              width: "80%",
              backgroundColor: "#ffffff",
              borderRadius: "4px",
              marginBottom: "-30px",
              marginLeft: "23px",
            }}
          >
            <div
              style={{
                position: "absolute",
                height: "100%",
                width: `${(baseValue / max) * 100}%`,
                // backgroundColor: "#90caf9", // Adjust color as needed
                backgroundColor: '#D0D3EB', // Adjust color as needed
                borderRadius: "4px",
              }}
            ></div>
          </div>

          <StyledSlider
            baseValue={baseValue}
            size="small"
            max={max}
            min={min}
            value={v}
            onChange={(e, newValue) => onChange(newValue as number)}
            step={0.1}
            onMouseEnter = {onHoverStart}
            onMouseLeave = {onHoverEnd}

          />
        </Grid>
        <Grid item xs={2.5}>
          <Input
            value={(v * 100) / max}
            margin="dense"
            onChange={(e) => {
              let val = Number(e.target.value);
              if (Number.isNaN(val)) val = (baseValue * 100) / max;
              if (val < 0) val = 0;
              if (val > 100) val = 100;
              onChangeInput((val * max) / 100);
            }}
            inputProps={{
              min,
              max,
              type: "number",
            }}
            endAdornment={<InputAdornment position="end">%</InputAdornment>}
            sx={{
              "input[type=number]::-webkit-outer-spin-button, input[type=number]::-webkit-inner-spin-button": {
                WebkitAppearance: "none",
                margin: 0,
              },
            }}
          />
        </Grid>
      </Grid>
    </>
  );
};

export default CustomSlider;