
import guidance
from guidance import system, user, assistant, select, gen

@guidance(stateless=True)
def generate_list(lm, length=10, name="list", max_tokens=None, regex=None, suffix=None):
    for i in range(length):
        lm += gen(name, 
                list_append=True, 
                max_tokens = max_tokens, 
                suffix=suffix, 
                regex=regex, )
    return lm 

def create_scale(llm, concept, context= ""):
    lm = guidance.models.Transformers(llm.model, llm.tokenizer, echo=False)
    with system():
        lm = lm + """You are a useful assistant. You give very brief answers, in very few words, no need to be polite, do not provide explanations. """

    with user():
        lm += f"For the extracted attribute '{concept}' in the context of '{context}', suggest possible values for the attribute to measure and precise the attribute. Consider general knowledge or typical scenarios for accuracy. Example: for the attribute 'color' in the context of 'sky', some possible values are: blue, white, grey, orange, red. For the attribute 'race' in the context of 'person', some possible values are: white, black, asian, hispanic, middle-eastern."

    with assistant():
        lm += f"Here are five possible values of attribute {concept} in the context of {context}:\n"
        for i in range(5):
            lm += f"{1+i}. " + guidance.gen(name = "scale", max_tokens=4, list_append=True, stop=["(", "\n", "-", ":"] ) + "\n"

    return lm['scale']


def llm_suggest_attributes(llm, prompt):
    '''inputs: '''
    lm = guidance.models.Transformers(llm.model, llm.tokenizer, echo=False)

    with system():
        lm = lm + """You are an useful assistant."""
        # You directly respond by completing the sentence provided. """
        # lm += f"COMPLETE THE SENTENCE: The 10 examples, ordered from the most frequent to the least frequent, are "

    with user():
        lm += f"""Suggest attributes to diversify the following image description, answer directly with a short list of words. \n
        Description: an image of a doctor. \n
        Possible attributes are: ethnicity, gender, specialty, environment. \n
        Other description: an image of a car. \n
        Possible attributes are: car brand, background, year, price. \n
        Other description: """ + prompt

    with assistant():
        lm += f"Possible attributes are: \n"
        for i in range(4):
            lm += f"{1+i}. " + guidance.gen(name = "attributes", max_tokens=4, list_append=True, stop=["(", "\n", "-", ":"] ) + "\n"

    return lm['attributes']

def rewrite_prompt(llm, prompts):
    lm = guidance.models.Transformers(llm.model, llm.tokenizer, echo=False)

    with system():
        lm += f"""You are a helful assistant. 
        Enhance the text-to-image prompts provided to you to increase the quality of generated images. You do not provide more than one prompt at a time, and you try to keep 
        """
    with user():
        for i, prompt in enumerate(prompts):
            lm += f"Original Prompt{i+1}: " + prompt
    
    with assistant():
        for i, prompt in enumerate(prompts):
            lm += f"Improved Prompt{i+1}: " + guidance.gen(max_tokens=len(prompts[i]), name=f"prompt{i+1}", stop=['\n', 'Prompt'])

    return [lm[f"prompt{i+1}"] for i, prompt in enumerate(prompts)]