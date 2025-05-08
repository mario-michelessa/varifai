import torch
from diffusers import AutoPipelineForText2Image
from transformers import CLIPProcessor, CLIPModel
from utils_backend import create_clip_emb
clip_processor = CLIPProcessor.from_pretrained("models/clip/clip-processor-bigG/") # openai/clip-vit-large-patch14
clip_model = CLIPModel.from_pretrained("models/clip/clip-model-bigG")  # laion/CLIP-ViT-bigG-14-laion2B-39B-b160k
pipe = AutoPipelineForText2Image.from_pretrained(f"models/diffusion_models/sd-xl-lightning", torch_dtype=torch.float16).to('cuda:1')

import os
import numpy as np
DATA_DIR = "folder/to/data/US1"

usecases = [0, 2, 1, 2, 0, 1, 0, 1, 2, 2, 0, 1, 2, 1, 2, 0, 0, 1, 2, 2, 1, ]
# usecase_names = ['car', 'bird']
usecase_names = ['doctor', 'car', 'bird']

n_iter = 20
m = 50
batch_size = 10

general_prompts = ['an image of a doctor', 'an image of a car', 'an image of a bird']

#promptist
usecase = "car"
n=17
print(f"Generating promptist images for {usecase} {n}/{n_iter}")
llm_folder = f"../data/promptist_images/{usecase}/{n}"

prompts = open(f"{llm_folder}/prompts.txt", 'r').readlines()
images = []
for i in range(0, min(m, len(prompts)), 10):
    images.extend(pipe(
        prompt=prompts[i:min(len(prompts), i+10)],
        num_inference_steps=4,
        guidance_scale = 0, 
        return_dict=False,
        height = 1024,
        width = 1024,
        )[0])

clip_embs = create_clip_emb(clip_processor, clip_model, images = images)
np.save(f"{llm_folder}/image_embs.npy", clip_embs)
for i, img in enumerate(images):
    img.save(f"{llm_folder}/{i}.png")

# birds 0-17

usecase = "bird"
for n in range(0,18):
    print(f"Generating promptist images for {usecase} {n}/{n_iter}")
    llm_folder = f"../data/promptist_images/{usecase}/{n}"

    prompts = open(f"{llm_folder}/prompts.txt", 'r').readlines()
    images = []
    for i in range(0, min(m, len(prompts)), 10):
        images.extend(pipe(
            prompt=prompts[i:min(len(prompts), i+10)],
            num_inference_steps=4,
            guidance_scale = 0, 
            return_dict=False,
            height = 1024,
            width = 1024,
            )[0])

    clip_embs = create_clip_emb(clip_processor, clip_model, images = images)
    np.save(f"{llm_folder}/image_embs.npy", clip_embs)
    for i, img in enumerate(images):
        img.save(f"{llm_folder}/{i}.png")

# baseline
# cars 2-9
usecase = "car"
for n in range(2,10):
    print(f"Generating baseline images for {usecase} {n}/{n_iter}")
    folder = f"../data/baseline_images/{usecase}/{n}"
    os.makedirs(folder, exist_ok=True)

    prompts = [general_prompts[1]] * m 
    images = []
    for i in range(0, min(m, len(prompts)), 10):
        images.extend(pipe(
            prompt=prompts[i:min(len(prompts), i+10)],
            num_inference_steps=4,
            guidance_scale = 0, 
            return_dict=False,
            height = 1024,
            width = 1024,
            )[0])
    
    clip_embs = create_clip_emb(clip_processor, clip_model, images = images)
    np.save(f"{folder}/image_embs.npy", clip_embs)
    for i, img in enumerate(images):
        img.save(f"{folder}/{i}.png")

usecase = "bird"
for n in range(0,10):
    print(f"Generating baseline images for {usecase} {n}/{n_iter}")
    folder = f"../data/baseline_images/{usecase}/{n}"
    os.makedirs(folder, exist_ok=True)

    prompts = [general_prompts[2]] * m 
    images = []
    for i in range(0, min(m, len(prompts)), 10):
        images.extend(pipe(
            prompt=prompts[i:min(len(prompts), i+10)],
            num_inference_steps=4,
            guidance_scale = 0, 
            return_dict=False,
            height = 1024,
            width = 1024,
            )[0])
    
    clip_embs = create_clip_emb(clip_processor, clip_model, images = images)
    np.save(f"{folder}/image_embs.npy", clip_embs)
    for i, img in enumerate(images):
        img.save(f"{folder}/{i}.png")

