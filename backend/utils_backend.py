import io 
import base64
import numpy as np
import torch

def load_llm(llm_name, device):

    if llm_name == 'llama':
        from transformers import AutoModelForCausalLM, LlamaTokenizer, BitsAndBytesConfig
        model_name = "/mnt/raid/mario/models/llm/llama/"
        m = AutoModelForCausalLM.from_pretrained(
            model_name,
            quantization_config=BitsAndBytesConfig(
                load_in_4bit=True,
                bnb_4bit_compute_dtype=torch.float32,
                bnb_4bit_use_double_quant=True,
                bnb_4bit_quant_type='nf4'
            ),   torch_dtype=torch.float32,  # Change to float32

        device_map=device
        )
        tok = LlamaTokenizer.from_pretrained(model_name)
        tok.bos_token_id = 1
        from transformers import pipeline
        pipe = pipeline('text-generation', model=m, tokenizer=tok, )
    elif llm_name == 'gpt2':
        from transformers import pipeline
        pipe = pipeline("text-generation", model="/mnt/raid/mario/models/llm/gpt2/", tokenizer="/mnt/raid/mario/models/llm/gpt2/")
    else:
        raise ValueError("Invalid LLM name. Choose between 'llama' and 'gpt2'.")
    return pipe

from diffusers import AutoPipelineForInpainting, AutoPipelineForText2Image
from diffusers.utils import load_image

def load_sd(device, model="sd-mini"):

    if model in ['sd-mini', 'sd-vanilla', 'sd-xl-base', 'sd-xl-lightning']:
        pipe = AutoPipelineForText2Image.from_pretrained(f"/mnt/raid/mario/models/diffusion_models/{model}", torch_dtype=torch.float16).to(device)
    elif model in ['sd-xl-inpainting']:
        pipe = AutoPipelineForInpainting.from_pretrained(f"/mnt/raid/mario/models/diffusion_models/{model}", torch_dtype=torch.float16).to(device)
    else:
        raise ValueError("Invalid model name. Choose between 'sd-mini', 'sd-vanilla', 'sd-xl'.")
    
    return pipe 

def convert_to_b64(images):
    b64_images = []
    for img in images: 
        # img = Image.fromarray(img)
        img = img.convert("RGB").resize((256, 256))
        img_byte_array = io.BytesIO()
        img.save(img_byte_array, format="PNG")
        img_byte_array = img_byte_array.getvalue()
        img_b64 = base64.b64encode(img_byte_array).decode('utf-8')
        b64_images.append(f'data:image/jpeg;base64,{img_b64}')

    return b64_images

from  PIL import Image

def decode_image(image_data):
    header, encoded = image_data.split(',', 1) if ',' in image_data else ('', image_data)
    image_bytes = base64.b64decode(encoded)
    image = Image.open(io.BytesIO(image_bytes))
    return image

def create_clip_emb(clip_processor, clip_model, images=None, texts=None, batch_size=101):
    result = []
    if images is not None:
        print(len(images))
        if len(images) < batch_size:
            inputs = clip_processor(text=None, images=images, return_tensors="pt")["pixel_values"]
            embeddings = clip_model.get_image_features(inputs).detach().cpu().numpy()
            return embeddings
        
        # need to correct this 
        for i in range(0, len(images) // batch_size):
            inputs = clip_processor(text=None, images=images[i * batch_size : min(len(images), (i+1) * batch_size)], return_tensors="pt",)["pixel_values"]
            embeddings = clip_model.get_image_features(inputs).detach().cpu().numpy()
            result.append(embeddings)
        result = np.concatenate(result, axis=0)
        
    if texts is not None:
        print(len(texts))

        if len(texts) < batch_size:
            inputs = clip_processor(text=texts, images=None, return_tensors="pt", truncation=True, padding=True)["input_ids"]
            embeddings = clip_model.get_text_features(inputs).detach().cpu().numpy()
            return embeddings
        
        for i in range(0, len(texts) // batch_size):
            print(len(texts[i * batch_size : min(len(texts), (i+1) * batch_size)]))
            inputs = clip_processor(text=texts[i * batch_size : min(len(texts), (i+1) * batch_size)], images=None, return_tensors="pt", truncation=True, padding=True)["input_ids"]
            embeddings = clip_model.get_text_features(inputs).detach().cpu().numpy()
            result.append(embeddings)
        result = np.concatenate(result, axis=0)

    return result

import pandas as pd

def convert_to_prob(classes, labels,):
    occurences = [0] * len(classes)
    for l in labels:
        occurences[l] += 1
    return classes, [l/sum(occurences) for l in occurences]
    
def hist_prob_to_str(hist, n_im):
    s = sum(hist)
    if s == 0: 
        return [ "0" for h in hist ]
    hist = [ str(n_im * h / s) for h in hist ] 
    return hist

def hist_str_to_prob(hist):
    hist = [ float(h) for h in hist ]
    s = sum(hist)
    if s == 0:
        return [ 0 for h in hist ]
    hist = [ h / s for h in hist ] 
    return hist

def kl_divergence(p, q):
    print(p, q)
    p = np.asarray(p)
    q = np.asarray(q)
    return np.sum(p[np.where(q > 0)] * np.log(p[np.where(q > 0)] / q[np.where(q > 0)]))


def entropy(p):
    p = np.array(p)
    p = p[p>0]
    return -np.sum(p * np.log(p))
