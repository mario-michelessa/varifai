        # normal sampling
import torch
from diffusers import AutoPipelineForInpainting, AutoPipelineForText2Image
import os
import json
import numpy as np
import shutil
from transformers import CLIPProcessor, CLIPModel
from utils_backend import create_clip_emb

clip_processor = CLIPProcessor.from_pretrained("openai/clip-vit-large-patch14") 
clip_model = CLIPModel.from_pretrained("laion/CLIP-ViT-bigG-14-laion2B-39B-b160k")  

DATA_DIR = "/mnt/ssd1/mario/codes/prompt-diversity/data/US1"

usecases = [0, 2, 1, 2, 0, 1, 0, 1, 2, 2, 0, 1, 2, 1, 2, 0, 0, 1, 2, 2, 1, ]
usecase_names = ['doctor', 'car', 'bird']
scenarios = [usecase_names[i] for i in usecases]

conditions = ['open1', 'guided', 'accurate', 'open2', 'baseline', 'other', ]
experiments = sorted(os.listdir('../data/US1'))
print(scenarios)

from sklearn.manifold import TSNE
from sklearn.decomposition import PCA

def load_data(session_name, big=False):
    folder = os.path.join(DATA_DIR, session_name)
    if not os.path.exists(folder): 
        print(f"No data found for session {session_name}. {folder}")
        return
    
    file_path = f"{folder}/data.json"
    with open(file_path, 'r') as file:
        data = json.load(file)

    if big: data_numpy = np.load(f"{folder}/image_embs_big.npz")
    else: data_numpy = np.load(f"{folder}/image_embs.npz")

    return data['0'], data_numpy

class ImageGenerator:
    def __init__(self, experiments=[], device='cuda:0'):
        self.pipe = AutoPipelineForText2Image.from_pretrained(f"/mnt/raid/mario/models/diffusion_models/sd-xl-lightning", torch_dtype=torch.float16).to(device)
        self.distributions = {}
        self.general_prompts = {}
        self.load_exps(experiments)

    def load_exps(self, exps):
        for exp in exps:    
            p = exp[1:3].strip('-')
            if len(exp.split('-')) > 1:
                c = exp.split('-')[1]
                tab, _ = load_data(exp)
                step = 0
                for i, m in enumerate(tab['messages']):
                    if m['sender'] == 'bot' and m['type'] == 'generate':
                        dist_json = m['data']['distributions']
                        self.distributions[f"{p}-{c}-{step}"] = []
                        # print(m['data'].keys())
                        self.general_prompts[f"{p}-{c}-{step}"] = m['data']['prompts'][0].split(',')[0]
                        # print(self.general_prompts[f"{p}-{c}-{step}"] )
                        for d in dist_json:
                            self.distributions[f"{p}-{c}-{step}"].append([d['dimension'], d['x'], [float(y) for y in d['y_target']]])
                        step += 1

    def sample(self, d, n):
        '''returns n sampled values of x according to the target distribution'''
        dis = n * np.array(d[2]) / np.sum(d[2])
        dis = np.round(dis).astype(int)
        flat_array = [i for i in range(len(dis)) for _ in range(dis[i])]
        if len(flat_array) < n:
            flat_array += np.random.choice(flat_array, n - len(flat_array)).tolist()

        return [d[1][idx] for idx in np.random.permutation(np.array(flat_array))]
        # normal sampling
        #     return np.random.choice(self.x, p=self.y_target)

    def get_prompts(self, n, p, cond, step):
        '''returns n prompts for the given participant, condition and step'''
        if f"{p}-{cond}-{step}" not in self.distributions.keys():
            # print(self.distributions.keys())
            return None
        prompts = [self.general_prompts[f'{p}-{cond}-{step}'] for _ in range(n)]
        for d in self.distributions[f"{p}-{cond}-{step}"]:
            sample = self.sample(d, n)
            prompts = [f"{p}, {d[0]} {sample[i]}" for i, p in enumerate(prompts)]
        
        return prompts

    def generate(self, p=None, c=None, step=None, n=None):
        # print(prompts)
        prompts = self.get_prompts(n, p, c, step)
        if prompts is None:
            return None
            # print(prompts)
        gen_img = []
        for i in range(0, len(prompts), 10):
            gen_img.extend(self.pipe(
                prompt=prompts[i:min(len(prompts), i+10)],
                num_inference_steps=4,
                guidance_scale = 0, 
                return_dict=False,
                height = 1024,
                width = 1024,
                )[0])
            
        return gen_img

image_generator = ImageGenerator(experiments, device='cuda:1')

for exp in experiments:
    image_folder = f'../data/US1/{exp}/images_more'
    p = exp[1:3].strip('-')
    if len(exp.split('-')) > 1:
        c = exp.split('-')[1]
        print(exp, p, c)
        clip_embs_steps = []

        step = 0
        images = image_generator.generate(p=p, c=c, step=step, n=40)
        while images is not None:
            print(step)
            for i, img in enumerate(images):
                img.save(f"{image_folder}/{step}_{i+10}.png")
            
            clip_embs = create_clip_emb(clip_processor, clip_model, images = images)
            clip_embs_steps.append(clip_embs)
            
            # next step
            step += 1
            images = image_generator.generate(p=p, c=c, step=step, n=40)

        prev_clip_embs = np.load(f"../data/US1/{exp}/image_embs_big.npz")
        clip_embs_steps = [np.concatenate([prev_clip_embs[f], clip_embs_steps[i]], axis=0) for i, f in enumerate(prev_clip_embs.files)]
        print([c.shape for c in clip_embs_steps])
        np.savez(f"../data/US1/{exp}/image_embs_big_more.npz", *clip_embs_steps)
