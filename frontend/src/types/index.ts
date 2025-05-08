import { createTheme } from '@mui/material/styles';

export interface metric {
    dimension: string;
    entropy: number;
    kl: number;
}

export interface ImageData {
    images: string[];
    prompts: string[];
    labels: string[][];
    distributions: Distribution[];
}

export function isImageData(data: any): data is ImageData {
    return data !== null && typeof data === 'object' && 'images' in data;
}

export interface Distribution {
    index_measure?: number;
    dimension: string;
    x: string[];
    y: number[];
    y_target: number[];
    metrics?: {
        [key: string]: metric;
    };
    labels:string[];
}

export function isDistribution(data: any): data is Distribution {
    return data !== null && typeof data === 'object' && 'dimension' in data && 'x' in data && 'y' in data;
}
export interface ApiCallProps {
    endpoint: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    payload?: any;
}

export interface ApiCallResponse {
    text: string | JSX.Element;
    sender: "bot" | "user";
}

export type Message = ApiGenerateResponse | ApiMeasureResponse | ApiMessage;

export interface ApiMessage extends ApiCallResponse {
    type: "message";
    data: null;
}

export interface LoadApiResponse extends ApiCallResponse {
    messages: Message[];
    lastDataset: ImageData | null;
}

export interface ApiGenerateResponse extends ApiCallResponse {
    type: "generate";
    data: ImageData;
}

export interface ApiMeasureResponse extends ApiCallResponse {
    type: "measure";
    data: Distribution;
}

export interface ButtonProps { 
    label: string;
    action: () => void;
}

export const theme = createTheme(
{
    
        palette: {
          primary: {
            main: '#3949ab',
          },
          secondary: {
            main: '#ff7043',
          },
          tonalOffset: 0.4,
        },
      
        typography: {
        fontFamily: 'Roboto, Arial, sans-serif',
      },
    
  });

  export function convertStringNumbers(obj: any): any {
    if (Array.isArray(obj)) {
        return obj.map(convertStringNumbers);
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([key, value]) => [key, convertStringNumbers(value)])
        );
    } else if (typeof obj === 'string' && !isNaN(Number(obj))) {
        return Number(obj);
    }
    return obj;
}
