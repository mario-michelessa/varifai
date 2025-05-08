import React, { useState, MouseEvent } from 'react';
// import './SimpleMenu.css';
import { ButtonProps } from '../types';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';

interface SimpleMenuProps {
  buttons: ButtonProps[];
}
const SimpleMenu:React.FC<SimpleMenuProps> = ({buttons}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleClick = (event:React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div>
      <Button aria-controls="simple-menu" aria-haspopup="true" onClick={handleClick}>
        Open Menu
      </Button>
      <Menu
        id="simple-menu"
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        {buttons.map((btn, index) => (
                  <MenuItem
                    key={index}
                    className="menu-item"
                    onClick={() => { btn.action();}}
                  >
                    {btn.label}
                  </MenuItem>
                ))}
        
      </Menu>
    </div>
  );
}
export default SimpleMenu;
