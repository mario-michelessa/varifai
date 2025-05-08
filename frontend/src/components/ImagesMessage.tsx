
import React, { useState, useEffect, useRef } from 'react';
import './ImagesComponent.css';
import { ImageData } from '../types';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import Tooltip, { TooltipProps, tooltipClasses } from '@mui/material/Tooltip';
import Backdrop from '@mui/material/Backdrop';
import { styled } from '@mui/material/styles';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import html2canvas from 'html2canvas';
import { useAppContext } from '../Context';
import MeasurePlot from './MeasurePlot';

interface ImagesMessageProps {
    imageData: ImageData;
    // cols: number;
    // imageSize: number;
}

const ImagesMessage: React.FC<ImagesMessageProps> = ({imageData}) => {
    
    let [images, prompts] = [imageData.images, imageData.prompts];
    let distributions = imageData.distributions;

    const cols=Math.ceil( 1.5 * Math.sqrt(imageData.images.length));
    const imageSize= 800 / Math.ceil( 2 * Math.sqrt(imageData.images.length));

    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const mosaicRef = useRef<HTMLDivElement>(null);

    const copyToClipboard = () => {
        if (mosaicRef.current) {
            html2canvas(mosaicRef.current).then(canvas => {
                canvas.toBlob(blob => {
                    if (blob) {
                        const item = new ClipboardItem({ 'image/png': blob });
                        navigator.clipboard.write([item]);
                    }
                });
            });
        }
    };

    return (
        <>
            <div style={{ position: 'relative' }}>
                <div ref={mosaicRef}>
                    <ImageList
                        sx={{ width: imageSize * cols, height: Math.ceil(images.length / cols) * imageSize + 10 }}
                        cols={cols}
                        gap={3}
                        rowHeight={imageSize}
                    >
                        {images.map((src, index) => (
                            <ImageListItem key={index}>
                                <img
                                    src={src}
                                    alt={`From Flask ${index}`}
                                    onClick={() => setSelectedImage(src)}
                                    />
                            </ImageListItem>
                        ))}
                    </ImageList>
                </div>
                <IconButton
                    // variant="contained"
                    color="primary"
                    onClick={copyToClipboard}
                    style={{ position: 'absolute', top: 10, right: 10, }}
                    
                >
                <ContentCopyIcon />
                </IconButton>
            </div>
            <Backdrop open={Boolean(selectedImage)} onClick={() => setSelectedImage(null)} sx={{ zIndex: 10000 }}>
                <>
                    <img src={selectedImage ? selectedImage : ""} alt="Selected" height={500} width={500} />
                </>
            </Backdrop>
            {distributions && distributions.map((distribution, index) => (
                <MeasurePlot key={index} origDistribution={distribution} max={images.length}/>
            ))}
        </>
    );
};

export default ImagesMessage;
