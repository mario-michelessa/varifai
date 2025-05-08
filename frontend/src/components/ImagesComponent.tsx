
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

interface ImagesComponentProps {
    // imageData: ImageData;
    // cols: number;
    // imageSize: number;
}

interface HoverInfo {
    prompt: string;
    label: string[];
    tooltipStyle: {
        left: string;
        top: string;
    };
}

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

const ImagesComponent: React.FC<ImagesComponentProps> = ({}) => {
    const {state, dispatch, callApi} = useAppContext();
    const { lastDataset, highlightedIndices } = state;
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    const mosaicRef = useRef<HTMLDivElement>(null);

    if (!lastDataset) {
        return null;
    }

    let images = lastDataset.images;
    let labels = state.labels;

    const cols=Math.ceil( 1.5 * Math.sqrt(lastDataset.images.length));
    const imageSize=2000 / Math.ceil( 2 * Math.sqrt(lastDataset.images.length));

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
                            <HtmlTooltip
                                key={index}
                                followCursor
                                title={
                                    <>
                                        {(labels.length > index) && labels[index].map((label, id_dim) => (
                                            <div key={id_dim}>{labels[index][id_dim]}</div>
                                        ))}
                                    </>
                                }
                            >
                                <ImageListItem
                                sx={{
                                    outline: highlightedIndices.includes(index)
                                        ? '5px solid #3949ab' // Highlight with primary color
                                        : 'none', // No outline if not highlighted
                                    outlineOffset: '-5px', // Moves the outline inside the image
                                    boxShadow: highlightedIndices.includes(index)
                                        ? '0px 4px 15px rgba(0,0,0,0.2)' // Optional shadow if highlighted
                                        : 'none',
                                    transition: 'outline 0.1s ease, box-shadow 0.1s ease',
                                }}>
                                    <img
                                        src={src}
                                        alt={`${index}`}
                                        onClick={() => setSelectedImage(src)}
                                    />
                                </ImageListItem>
                            </HtmlTooltip>
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
        </>
    );
};

export default ImagesComponent;
