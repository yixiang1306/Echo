import requests
from openai import OpenAI
import os
import json
import random
from dotenv import load_dotenv
import sys
from collections import deque
# Load environment variables
load_dotenv()

# Access API keys and endpoint
RUNPOD_API_KEY = os.getenv("RUNPOD_KEY")
RUNPOD_SERVER_ENDPOINT = os.getenv("RUNPOD_SERVER_ENDPOINT")
WALLPAPER_HEAVEN_ENDPOINT = os.getenv("WALLPAPER_HEAVEN_ENDPOINT")

# Ensure GOOGLE_APPLICATION_CREDENTIALS is set
YOUTUBE_API_KEY = os.getenv("GOOGLE_API_KEY")
YOUTUBE_SEARCH_URL =os.getenv("YOUTUBE_SEARCH_URL")

# Initialize OpenAI Client
client = OpenAI(
    api_key=RUNPOD_API_KEY,
    base_url=f"{RUNPOD_SERVER_ENDPOINT}/v1",
)

def search_wallhaven_image(search_param: str):

    # Prepare query parameters
    params = {"q": search_param}

    
    # Send API request
    response = requests.get(WALLPAPER_HEAVEN_ENDPOINT, params=params)
    
    if response.status_code == 200:
        data = response.json()
        if "data" in data and len(data["data"]) > 0:
             # Select a random wallpaper
            random_image = random.choice(data["data"])
            return random_image["path"]  # Return the image URL
    
    return "No image found."

def search_youtube_video(search_param: str):
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
            video_title = random_video["snippet"]["title"]
            video_url = f"https://www.youtube.com/watch?v={video_id}"
            return f"Here is a video related to {search_param}: {video_url}"
    
    return "No video found."


# Functions for Genshin Impact
def get_image(search_param: str):
    """Search for a character image from Google or Pinterest"""
    return search_wallhaven_image(search_param)

def get_video(search_param: str):
    """Search for a character video from YouTube"""
    return search_youtube_video(search_param)

# Tool definitions
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_video",
            "description": "Fetches a video the user requested. Run this when the user question includes words like 'video', 'trailer','youtube' or 'clip'.",
            "parameters": {
                "type": "object",
                "properties": {
                    "search_param": {
                        "type": "string",
                        "description": "Topic or description for the video, e.g., 'genshin impact gameplay video'."
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
        "description": "Fetches an image the user requested. Run this when the user question includes words like 'wallpaper', 'image', or 'photo'.",
        "parameters": {
            "type": "object",
            "properties": {
                "search_param": {
                    "type": "string",
                    "description": "Topic or description for the image, e.g., 'Raiden Shogun wallpaper' or 'sunset photo'."
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

# Model
MODEL_NAME = "NalDice/askvox-llama3.3-70b-16bit"

def get_response(user_input: str):

    lower_input = user_input.lower()
    # Check for keywords related to tools
    if any(word in lower_input for word in ["video", "trailer", "clip", "youtube"]):
        tool_name = "auto"
    elif any(word in lower_input for word in ["image", "wallpaper", "photo", "pic"]):
        tool_name = "auto"
    else:
        tool_name = "none"
    response_stream = client.chat.completions.create(
        model=MODEL_NAME,
        messages=[
            {"role": "system", "content": "You are a helpful game assistant with tool calling capabilities. Only use these tools if they are relevant to the user question. Only reply with a tool call if the function exists and the user question is specific to the tool description. If the user question is unrelated to the tool description, just reply directly in natural language. When you receive a tool call response, use the output to format an answer to the original user question."},
            {"role": "user", "content": user_input}
        ],
        temperature=0.5,
        max_tokens=200,
        tools=tools,
        tool_choice=tool_name
    )


    # Extract normal text response
    if response_stream.choices[0].message.content is not None:
        return response_stream.choices[0].message.content

    # Extract tool calls
    tool_calls = response_stream.choices[0].message.tool_calls
    if tool_calls:
        function_name = tool_calls[0].function.name
        function_args = json.loads(tool_calls[0].function.arguments)

        for tool in tool_functions:
            if tool == function_name:
                return tool_functions[function_name](function_args["search_param"])

        

    return "I'm sorry, It seem like the server is down. Please try again later."

# Run the function

# Read input from Electron's stdin
if __name__ == "__main__":
    while True:
        try:
            user_input = sys.stdin.readline().strip()
            if user_input:
                response = get_response(user_input)
                print(response, flush=True)  # Send response to Electron
        except Exception as e:
            print(f"Error: {str(e)} \n I'm sorry, It seem like the server is down. Please try again later.", flush=True)