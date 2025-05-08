
from utils_backend import *
from guidance_utils import *
import torch 
import os 

import numpy as np
import torch.nn.functional as F
from transformers import CLIPProcessor, CLIPModel
import json

DATA_DIR = "/mnt/ssd1/mario/codes/prompt-diversity/backend/session_data"
DEVICE = "cuda:1"

clip_processor = CLIPProcessor.from_pretrained("/mnt/raid/mario/models/clip/clip-processor") # openai/clip-vit-large-patch14
clip_model = CLIPModel.from_pretrained("/mnt/raid/mario/models/clip/clip-model")  # openai/clip-vit-large-patch14

def similarity(a, b):

    a, b = torch.from_numpy(a), torch.from_numpy(b)
    if len(a.shape) == 1:
        a = a.unsqueeze(0)
    if len(b.shape) == 1:
        b = b.unsqueeze(0)

    a_norm = F.normalize(a, p=2, dim=1)
    b_norm = F.normalize(b, p=2, dim=1)
    return torch.mm(a_norm, b_norm.transpose(0, 1))

class Distribution:
    '''This class stores a distribution of a dimension, and allows to sample from it, and to update it.'''
    def __init__(self, dimension=None, x=None, y_real=None, y_target=None):
        
        if dimension is None: # None case is for when loading the distribution
            return
        
        self.dimension = dimension # defines the distribution
        self.x = x

        if len(y_real) > 0 and type(y_real[0]) == str:
           self.y_real = hist_str_to_prob(y_real)
        else:
            self.y_real = y_real
        
        if y_target is not None and len(y_target) > 0 and type(y_target[0]) == str:
            self.y_target = hist_str_to_prob(y_target)
        elif y_target is not None:
            self.y_target = y_target # fixed by the user -> sum 1
        else: # y_target is never None - default values are the real values
            self.y_target = self.y_real
        
        # self.entropy = entropy(self.y_real)
        # self.kl_divergence = kl_divergence(self.y_real, self.y_target)
        # self.mae = np.mean(np.abs(np.array(self.y_real) - np.array(self.y_target)))


    def sample(self, n):
        print(f"Sampling {n} values from {self.dimension}... {self.x} {self.y_target}")
        '''returns n sampled values of x according to the target distribution'''
        dis = n * np.array(self.y_target) / np.sum(self.y_target)
        dis = np.round(dis).astype(int)
        flat_array = [i for i in range(len(dis)) for _ in range(dis[i])]
        if len(flat_array) < n:
            flat_array += np.random.choice(flat_array, n - len(flat_array)).tolist()
        print(f"Flat array: {flat_array}", self.x, dis, self.y_target)
        return [self.x[idx] for idx in np.random.permutation(np.array(flat_array))]
        # normal sampling
        #     return np.random.choice(self.x, p=self.y_target)


    def update(self, x, y_real, y_target):
        '''updates the distribution with new values,
        called when the user modifies x => update y_real and y_target
        called after image generation => update y_real and metrics'''
        # if the scale doesn't change, it means that its the images that changed, so do not changethe y_target
        # if self.x == x: 
        #     y_target = self.y_target
        if len(self.x) > len(x): #weird bug sometimes : quick fix 
            self.y_target = y_target[:len(x)]
        self.x = x
        self.y_real = y_real

        # y_target modification
        if y_target is not None:
            if len(y_target) > 0 and type(y_target[0]) == str:
                self.y_target = hist_str_to_prob(y_target)
            else:
                self.y_target = y_target
        else:
            self.y_target = self.y_real
        
        #handling when the user adds a word to the scale
        while len(self.x) > len(self.y_target): 
            self.y_target.append(self.y_real[-1])
        
        print(f"Updated distribution {self.dimension} with {len(self.x)} values and {len(self.y_target)} target values.")
        # self.entropy = entropy(self.y_real)
        # self.kl_divergence = kl_divergence(self.y_real, self.y_target)
        # self.mae = np.mean(np.abs(np.array(self.y_real) - np.array(self.y_target)))
        
    def save_distribution(self):
        '''returns the distribution in a format that can be saved in a json file'''
        return {"dimension": self.dimension,
                "x": self.x,
                "y": self.y_real,
                "y_target": self.y_target, 
                # "metrics": {"entropy": self.entropy, "kl": self.kl_divergence, "mae": self.mae}, }
                "metrics": {}, }
    
    def return_distribution(self, n_im):
        '''returns the distribution in a format that can be sent to the frontend'''
        return {"dimension": self.dimension,
                "x": self.x,
                "y": hist_prob_to_str(self.y_real, n_im=n_im),
                "y_target": hist_prob_to_str(self.y_target, n_im=n_im), 
                # "metrics": {"entropy": str(round(self.entropy, 2)), "kl": str(round(self.kl_divergence, 2)), "mae": str(round(self.mae, 2))}}
                "metrics": {}}
    
    def load_distribution(self, data):
        '''loads the distribution from a json file'''
        self.dimension = data['dimension']
        self.x = data['x']
        self.y_real = data['y']
        self.y_target = data['y_target']
        # self.entropy = data['metrics']['entropy']
        # self.kl_divergence = data['metrics']['kl']
        # self.mae = data['metrics']['mae'] if 'mae' in data['metrics'].keys() else 0

class Tab:
    ''' Stores the state of the interface'''

    def __init__(self, tab):
        self.tab = tab

        self.messages = []
        self.prompt_dataset = []
        self.image_embs = []
        self.labels = []
        self.previous_concept = None
        
        self.distributions = {}

    def sample_prompt_dataset(self, message, n_ims, llm=None):
        '''generates a dataset of n_ims prompts, following the distributions of the tab.'''

        prompt = self.previous_concept if message == "" else message
        self.previous_concept = prompt

        # Stochastic sampling of the dataset
        dataset = [prompt for _ in range(n_ims)]
        for dimension in self.distributions.keys():
            print(dimension)
            samples = self.distributions[dimension].sample(n_ims)
            dataset = [f"{d}, {dimension} {s}" for d, s in zip(dataset, samples)]

        print(f"Prompt dataset: {dataset}")
        if llm is not None:
            print("Rewriting prompts with LLM...")
            dataset = rewrite_prompt(llm, dataset)
        self.prompt_dataset = dataset
        return dataset

    def sync_distributions(self, distributions):
        '''after the user tunes the distribution in the interface, it updates the self.distributions variable with the new values
        called after image generation'''
        self.distributions = {}
        for distribution in distributions:
            dimension = distribution['dimension']
            self.distributions[dimension] = Distribution(dimension, 
                                                         distribution['x'], 
                                                         distribution['y'], 
                                                         distribution['y_target'])

    def receive_message(self, message):
        '''keeps track of messages'''
        message['sender'] = "user"
        self.messages.append(message)
    
    def send_message(self, message):
        message['sender'] = "bot"
        self.messages.append(message)
        return message
    
    def return_messages(self):
        '''called for session loading, returns all the messages of the tab, and the last dataset generated.'''
        data = {}
        for m in self.messages[::-1]:
            if ('type' in m.keys()) and (m['type'] == 'generate'):
                data['images'] = m['data']['images']
                data['prompts'] = m['data']['prompts']
                data['labels'] = m['data']['labels']
                data['distributions'] = m['data']['distributions']
                break
        
        return data, self.messages
    
    def save_data(self):
        data_json = {
            "messages": self.messages, 
            "prompt_dataset": self.prompt_dataset, 
            "previous_concept": self.previous_concept, 
            "distributions": [self.distributions[dimension].save_distribution() for dimension in self.distributions.keys()],
        } 
        data_numpy = np.array(self.image_embs)
        return data_json, data_numpy
    
    def load_data(self, data_json, data_numpy):
        self.messages = data_json['messages']
        self.prompt_dataset = data_json['prompt_dataset']
        self.distributions = {d['dimension']: Distribution() for d in data_json['distributions']}
        for d, dimension in zip(data_json['distributions'], self.distributions.keys()):
            self.distributions[dimension].load_distribution(d)
        self.previous_concept = data_json['previous_concept']
        self.image_embs = data_numpy

    def classify(self, texts,):
        '''zero-shot classification of the images on the texts, returns text labels and probs'''
        keyword_embeddings = create_clip_emb(clip_processor, clip_model, texts=texts)
        image_embeddings = self.image_embs
        similarity_scores = similarity(keyword_embeddings, image_embeddings)
        labels = torch.argmax(similarity_scores, dim=0).tolist()
        _, y_prob = convert_to_prob(texts, labels,)
        return [texts[i] for i in labels], y_prob
    
    # def generate_clip_scores(self):
    #     """Generate the similarity scores between the images and the prompts."""
    #     print("Generating clip scores...")
        
    #     keyword_embeddings = create_clip_emb(clip_processor, clip_model, texts=self.prompt_dataset)
    #     clip_scores = [similarity(keyword_embeddings[im], self.image_embs[im]) for im in range(len(self.image_embs))]
    #     print("clip scores generated.")
    #     return clip_scores

    def update_generation(self, image_embeddings):
        '''called after a generation, and updates all the distributions given the new images'''
        self.image_embs = image_embeddings
        # self.clip_scores = self.generate_clip_scores()
        # self.labels = [[f"Alignment: {int( 100 * x)}%" for x in self.clip_scores]]
        self.labels = []
        for dim in self.distributions.keys():
            dist = self.distributions[dim]
            l, y_real = self.classify([f"{dim} {c}" for c in dist.x])
            self.labels.append(l)
            dist.update(dist.x, y_real, dist.y_target)
        
        # return good format for backend
        if len(self.labels) > 0:
            labels = [[self.labels[i][j] for i in range(len(self.labels))] for j in range(len(self.labels[0]))]
        else:
            labels = [[] for _ in range(len(self.prompt_dataset))]
        return labels, [d.return_distribution(n_im=len(self.prompt_dataset)) for d in self.distributions.values()]
    
    def update_measure(self, dimension, x, y_target):
        '''called when the user makes a measure on the dataset'''
        labels, y = self.classify([f"{dimension} {c}" for c in x])
        if dimension not in self.distributions.keys():
            self.distributions[dimension] = Distribution(dimension, x, y, y_target)
        else:
            self.distributions[dimension].update(x, y, y_target)
        return self.distributions[dimension].return_distribution(n_im=len(self.prompt_dataset)), labels
    
    def remove_distribution(self, dimension):
        '''called when the user removes a distribution in the interface'''
        self.distributions.pop(dimension)

    def copy(self):
        '''needed for the history of the tabs'''
        tab = Tab(self.tab)
        tab.messages = self.messages
        tab.prompt_dataset = self.prompt_dataset
        tab.image_embs = self.image_embs
        tab.labels = self.labels
        tab.previous_concept = self.previous_concept
        tab.distributions = self.distributions
        return tab
    
class Session:
    """Manages the different tabs."""

    def __init__(self, session_name):
        self.session_name = session_name
        self.tabs = [Tab(0)]
        self.load_data(session_name)
    
    def save_data(self):
        session_name = self.session_name
        print(f"Saving data for session {session_name}")
        folder = os.path.join(DATA_DIR, session_name)
        os.makedirs(folder, exist_ok=True)

        data_json = {}
        data_numpy = []
        for i, tab in enumerate(self.tabs):
            print(f"Saving data for tab {i}")
            data_json_tab, data_numpy_tab = tab.save_data()
            data_json[i] = data_json_tab
            data_numpy.append(data_numpy_tab)

        json_data = json.dumps(data_json)
        file_path = f"{folder}/{session_name}_data.json"
        with open(file_path, 'w') as file:
            file.write(json_data)
    
        np.savez(f"{folder}/{session_name}_image_embs.npz", *data_numpy)

    def load_data(self, session_name):
        folder = os.path.join(DATA_DIR, session_name)
        if not os.path.exists(folder): 
            print(f"No data found for session {session_name}.")
            return
        
        file_path = f"{folder}/{session_name}_data.json"
        with open(file_path, 'r') as file:
            data = json.load(file)

        self.tabs = []
        data_numpy = np.load(f"{folder}/{session_name}_image_embs.npz")
        for i in range(len(data.keys())):
            print(f"Loading data for tab {i}")
            tab = Tab(i)
            tab.load_data(data[str(i)], data_numpy[f"arr_{i}"])
            self.tabs.append(tab)
        
    def reset_tab(self, tab=0):
        print(f"Resetting tab {tab}...")
        self.tabs[tab] = Tab(tab)

    def duplicate_tab(self, index):
        '''duplicate the current tab and returns the index of the duplicated one.'''
        print(f"Duplicating tab {index} to index {len(self.tabs)+1}...")
        tab = self.tabs[index].copy()
        self.tabs.append(tab)
        return len(self.tabs) -1

class Chat:
    '''Main class that manages the chatbot. Manages the calls to the foundation models.'''
    
    def __init__(self):
        self.device = torch.device(DEVICE if torch.cuda.is_available() else "cpu")
        
        #load models
        self.llm = load_llm('llama', self.device)
        self.im_size = 1024
        self.im_size_out = 300
        self.sd_model = load_sd(self.device, model="sd-xl-lightning")

        # self.generator = torch.Generator(self.device).manual_seed(42)
        self.session = Session(session_name="1")


    def measure(self, tab, dimension, x=None, y_target=None):
        '''Creates the scale using LLM and update the distributions of the tab.'''

        if len(self.session.tabs[tab].image_embs) == 0 :
            print("No images to measure.")
            return None
        
        if x is None:
            context = self.session.tabs[tab].previous_concept
            print(f"Creating scale of {dimension} with context {context}...")
            x = create_scale(self.llm, dimension, context)
            print(f"Keywords generated: {x}")

        dist, labels = self.session.tabs[tab].update_measure(dimension, x, y_target)

        return {"dimension":dist['dimension'],
                "x": dist['x'],
                "y": dist['y'],
                "y_target": dist['y_target'],
                "labels": labels ,
                # "metrics": dist['metrics'],
                "metrics": []
                }
        
    def generate(self, tab, message="", n_ims =10, use_llm=False):
        ''' Calls the diffusion model to generate images following tab state'''

        if len(message) == 0 and  len(self.session.tabs[tab].prompt_dataset) == 0:
            print("You need to provide a prompt.")
            return {"images": [], "prompts": [], "labels": [], "distributions": []}
        prompts = self.session.tabs[tab].sample_prompt_dataset(message, n_ims, llm=self.llm if use_llm else None)

        # rewrite prompts using a LLM
        # prompts = rewrite_prompt(self.llm, prompts)

        print(f"Prompt dataset: {prompts}")
        gen_imgs = []
        for i in range(0, len(prompts), 10):
            gen_img = self.sd_model(
                prompt=prompts[i:min(len(prompts), i+10)],
                num_inference_steps=8,
                guidance_scale = 0, 
                return_dict=False,
                # generator=self.generator,
                height = self.im_size,
                width = self.im_size,
                )[0]
            gen_imgs.extend(gen_img)
            
        image_embeddings = create_clip_emb(clip_processor, clip_model, images=gen_imgs)
        labels, distributions = self.session.tabs[tab].update_generation(image_embeddings)
        
        generated_b64 = convert_to_b64(gen_imgs)
        print(f"Images converted. {image_embeddings.shape}")
        return {"images": generated_b64, 
                "prompts": prompts, 
                "labels": labels if labels != [] else [[] for _ in range(len(generated_b64))], 
                "distributions": distributions}
    
    def suggest_attributes(self, tab):
        '''suggests attributes to add to the prompt'''
        prompt = self.session.tabs[tab].previous_concept
        print(f"Suggesting attributes for prompt {prompt}...")
        return llm_suggest_attributes(self.llm, prompt)
               