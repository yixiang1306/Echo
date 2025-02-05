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
max_tokens = 60000

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
    """Fetch an image from Wallhaven"""
    params = {"q": search_param}
    response = requests.get(WALLPAPER_HEAVEN_ENDPOINT, params=params)

    if response.status_code == 200:
        data = response.json()
        if "data" in data and len(data["data"]) > 0:
            return random.choice(data["data"])["path"]
    
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
            return text[:10000]

    except Exception as e:
        return f"Error extracting content from {url}: {str(e)}"

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

        return summarize_search_results(query, extracted_content)

    except Exception as e:
        return f"Error fetching search results: {str(e)}"

# Summarize search results. This will be used for web searching.
def summarize_search_results(query: str, extracted_content: list):
    """Use AI to summarize extracted web content."""
    prompt = f"""
    The user asked: '{query}'. I have gathered relevant content from different websites:

    {chr(10).join(extracted_content)}

    Summarize this information in a clear, concise, and user-friendly manner. avoid summarizing unrelated information. 
    """

    messages=[{"role": "system", "content": summerize_system_prompt},
                  {"role": "user", "content": prompt}]

    response = client.chat.completions.create(
        model=MODEL_NAME, 
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens
    )

    return response.choices[0].message.content if response.choices else "I couldn't retrieve useful information."

# Main function for normal response.
def get_response(user_input: str):
    global chat_history

    # **Detect if the user wants a web search**
    if any(word in user_input.lower() for word in ["web search", "look up", "search online", "find on the web", "search on the website","websearch" ]):
        return search_web(user_input.replace("web search", "").strip())

    # Prepare messages with conversation history
    messages = [{"role": "system", "content": system_prompt}] + list(chat_history)

    lower_input = user_input.lower()
    tool_name = "auto" if any(word in lower_input for word in ["video", "trailer", "clip", "youtube", "image","img", "wallpaper", "photo", "pic"]) else "none"

    response_stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=messages,
        temperature=temperature,
        max_tokens=max_tokens,
        tools=tools,
        tool_choice=tool_name
    )

    if response_stream.choices[0].message.content:
        assistant_response = response_stream.choices[0].message.content

        # **Fallback to Web Search if AI doesn't know**
        if "I don't know" in assistant_response or "I'm not sure" in assistant_response:
            return search_web(user_input)

        return assistant_response

    # Extract tool calls
    tool_calls = response_stream.choices[0].message.tool_calls
    if tool_calls:
        function_name = tool_calls[0].function.name
        function_args = json.loads(tool_calls[0].function.arguments)

        if function_name in tool_functions:
            response = tool_functions[function_name](function_args["search_param"])
            return response

    # **Fallback to Web Search if no response is given**
    return search_web(user_input)

# Read input from Electron's stdin
if __name__ == "__main__":
    while True:
        try:
            user_input = sys.stdin.readline().strip()
            if user_input:
                # Store user input in history
                chat_history.append({"role": "user", "content": user_input})

                response = get_response(user_input)
                response = response.replace("*", "")  # Remove asterisks from response

                # Store assistant response in history
                chat_history.append({"role": "assistant", "content": response})

                print(response, flush=True)
        except Exception:
            print("I'm sorry, It seems like the server is down. Please try again later.", flush=True)
