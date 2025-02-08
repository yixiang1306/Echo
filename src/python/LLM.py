import requests
from openai import OpenAI
import os
import json
import random
from dotenv import load_dotenv
import sys
from collections import deque
from googlesearch import search  # <-- Google Search
from bs4 import BeautifulSoup

# Load environment variables
load_dotenv()

# Access API keys and endpoint
RUNPOD_API_KEY = os.getenv("RUNPOD_KEY")
RUNPOD_SERVER_ENDPOINT = os.getenv("RUNPOD_SERVER_ENDPOINT")
WALLPAPER_HEAVEN_ENDPOINT = os.getenv("WALLPAPER_HEAVEN_ENDPOINT")
YOUTUBE_API_KEY = os.getenv("GOOGLE_API_KEY")
YOUTUBE_SEARCH_URL = os.getenv("YOUTUBE_SEARCH_URL")


# LLM CONFIG
MODEL_NAME = "NalDice/askvox-llama3.3-70b-16bit"
temperature = 0.5
max_tokens = 10000

# Context Window (stores last N interactions)
CONTEXT_WINDOW_SIZE = 10  # Adjust this value based on available token limits
chat_history = deque(maxlen=CONTEXT_WINDOW_SIZE * 2)  # Stores both user and assistant messages

#FOR NORMAL CONVERSATION
system_prompt = '''
Your name is Echo.
You are friendly and intelligent. 
You are a helpful game assistant with tool calling capabilities. 
Maintain context from the conversation and only call tools when necessary. 
avoid using special characters and emojis.
'''
#FOR SUMMARIZATION
summerize_system_prompt = '''
Your name is Echo.
You are friendly and intelligent.
You are a helpful game assistant.
Summarize the following web content in a clear and friendly way.
Summarize this information in a clear, concise, and user-friendly manner.
avoid summarizing unrelated information. 
avoid using special characters and emojis. 
'''

# Initialize OpenAI Client
client = OpenAI(
    api_key=RUNPOD_API_KEY,
    base_url=f"{RUNPOD_SERVER_ENDPOINT}/v1",
)

#Main Functions for Images & Videos
def search_wallhaven_image(search_param: str):
    """Fetch an image from the first three pages of Wallhaven, sorted by views"""
    all_images = []

    for i in range(1, 4):  # Loop through pages 1, 2, and 3
        params = {
            "q": search_param,  # Search query
            "sorting": "views",  # Sorting by most viewed images
            "order": "desc",  # Order by descending (most popular first)
            "ai_art_filter": "1",  # AI-generated images filter (1 = allow AI images)
            "page": i,  # Iterate through pages 1 to 3
        }
        
        response = requests.get(WALLPAPER_HEAVEN_ENDPOINT, params=params)

        if response.status_code == 200:
            data = response.json()
            if "data" in data and len(data["data"]) > 0:
                all_images.extend(data["data"])  # Add all images from the page

    # If we have collected images from all pages, return a random one
    if all_images:
        return random.choice(all_images)["path"]

    return "Sorry, I couldn't find an image of your request. Please try again."
def search_youtube_video(search_param: str):
    """Fetch a video from YouTube and return an embed link"""
    params = {
        "part": "snippet",
        "q": search_param,
        "type": "video",
        "maxResults": 5,
        "key": YOUTUBE_API_KEY,
    }
    response = requests.get(YOUTUBE_SEARCH_URL, params=params)

    if response.status_code == 200:
        data = response.json()
        if "items" in data and len(data["items"]) > 0:
            random_video = random.choice(data["items"])
            video_id = random_video["id"]["videoId"]
            return f"https://www.youtube.com/embed/{video_id}"  # Embed link format
    
    return "Sorry, I couldn't find a video of your request. Please try again."

# Functions for Images & Videos
def get_image(search_param: str):
    """Search for an image"""
    return search_wallhaven_image(search_param)

def get_video(search_param: str):
    """Search for a video"""
    return search_youtube_video(search_param)

# Tool definitions
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_video",
            "description": "Fetches a video related to the user's request.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_param": {
                        "type": "string",
                        "description": "Video search query, e.g., 'game trailer'."
                    }
                },
                "required": ["search_param"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_image",
            "description": "Fetches an image related to the user's request.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_param": {
                        "type": "string",
                        "description": "Image search query, e.g., 'wallpaper'."
                    }
                },
                "required": ["search_param"]
            }
        }
    }
]

tool_functions = {
    "get_image": get_image,
    "get_video": get_video
}


# Text Extraction fro web
def extract_text_from_url(url):
    """Extracts readable text from a given URL."""
    try:
        headers = {"User-Agent": "Mozilla/5.0"}
        response = requests.get(url, headers=headers, timeout=5)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, "html.parser")

            # Remove unwanted elements (scripts, styles, etc.)
            for script in soup(["script", "style", "header", "footer", "nav", "aside"]):
                script.extract()

            # Get visible text
            text = " ".join(soup.stripped_strings)

            # Return first 10000 characters to avoid LLM overload
            return text[:30000]

    except Exception as e:
        return " "

# Fetch search result links from web
def search_web(query: str):
    """Fetches top 3 Google search results, scrapes content, and summarizes them."""
    try:
        results = list(search(query, num_results=3))  # Get top 3 results

        if not results:
            return "No relevant information found."

        # Extract text from each website
        extracted_content = []
        for url in results:
            text = extract_text_from_url(url)
            if text:
                extracted_content.append(f"Website: {url}\nContent:\n{text}\n\n")

        if not extracted_content:
            return "Couldn't extract content from the search results."

        return sumamrize_search_response(query, extracted_content)

    except Exception as e:
        return f"Error fetching search results: {str(e)}"

# Summarize search results. This will be used for web searching.
def sumamrize_search_response(query: str, extracted_content: list):
    #Use AI to summarize extracted web content
    prompt = f"""
    The user asked: '{query}'. I have gathered relevant content from different websites:

    {chr(10).join(extracted_content)}

    Summarize this information in a clear, concise, and user-friendly manner depending on the user's question. avoid summarizing unrelated information. analyze the content and provide a concise summary based on the user question. 
    """

    full_response = ""

    messages=[{"role": "system", "content": summerize_system_prompt},
                  {"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model=MODEL_NAME, 
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        stream=True
    )

    for chunk in response:
        full_response += chunk.choices[0].delta.content
        print(chunk.choices[0].delta.content, end="", flush=True)

    #add summary to chat history
    chat_history.append({"role": "assistant", "content": full_response})


    

  

# Main function for normal response.
def get_response(user_input: str):
    global chat_history
    streamConfig = True
    tool_name = "none"
    full_response = ""

    lower_input = user_input.lower()

    # Add user input to conversation history
    chat_history.append({"role": "user", "content": user_input})

    

    # **Detect if the user wants a web search**
    if any(word in lower_input for word in ["web search", "look up", "search online", "find on the web", "search on the website","websearch", "search it on the web" ]):
        return search_web(user_input.replace("web search", "").strip())
    
    # **Detect if the user wants a tool call**
    if any(word in lower_input for word in ["video", "trailer", "clip", "youtube", "image","img", "wallpaper", "photo", "pic"]):
        tool_name = "auto"
        streamConfig = False 
    else:
        tool_name = "none"
        streamConfig = True
    

    # Prepare messages with conversation history
    messages = [{"role": "system", "content": system_prompt}] + list(chat_history)

    response_stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        tools=tools,
        tool_choice=tool_name,
        stream=streamConfig
    )

    if(streamConfig):
        for chunk in response_stream:
            full_response += chunk.choices[0].delta.content
            
            #this will output the full response of the LLM
            print(chunk.choices[0].delta.content, end="", flush=True)

    else:
        # Extract tool calls
        tool_calls = response_stream.choices[0].message.tool_calls
        if tool_calls:
            function_name = tool_calls[0].function.name
            function_args = json.loads(tool_calls[0].function.arguments)

            if function_name in tool_functions:
                full_response = tool_functions[function_name](function_args["search_param"])

                #this will output the full response of the tool
                print(full_response, end="", flush=True) 

    # Add assistant response to conversation history
    chat_history.append({"role": "assistant", "content": full_response})   





# Read input from Electron's stdin
# if __name__ == "__main__":
#     while True:
#         try:
#             user_input = sys.stdin.readline().strip()
#             if user_input:
#                 # Store user input in history
#                 chat_history.append({"role": "user", "content": user_input})

#                 response = get_response(user_input)
#                 response = response.replace("*", "")  # Remove asterisks from response

#                 # Store assistant response in history
#                 chat_history.append({"role": "assistant", "content": response})

#                 print(response, flush=True)
#         except Exception:
#             print("I'm sorry, It seems like the server is down. Please try again later.", flush=True)





if __name__ == "__main__":
    while True:
        try:
            user_input = sys.stdin.readline().strip()
            if user_input:
                get_response(user_input)
               
        except Exception:
            print("I'm sorry, the server is down. Please try again later.", flush=True)


