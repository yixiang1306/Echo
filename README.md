:robot: __ECHO__ 
<br/><br/>
The project is to create a speech-powered application, leveraging the Llama3.3 large language model (LLM) to serve as a specialized knowledge assistant.
<br/><br/>
__Features__
- User can have conversations with Echo, edit prompts, save conversation history
- Respond to user's prompts with text, images or videos
- Integrated Speech-to-Text and Text-to-Speech capabilities, enabling seamless voice interaction between users and the assistant.
- Implements a tiered subscription model, offering Basic, Premium, and One-time Token options to users.
- Discord Integration allowing application functions to be used in a discord channel with a dicord bot.
- The application functions as a screen overlay that users can activate or deactivate via keybinds, enabling them to remain on their current tab without switching windows.
- Supabase as database for user management/authentication
<br/><br/>
:mechanical_arm:__Tech used:__<br/><br/>
__Project Management__
- Jira
<br/><br/>
__Application__
- React, Google APIs(Speech-To-Text/Text-To-Speech API, Youtube Data API), PostgreSQL(Supabase), Electron.JS, TailWindCSS, TypeScript, NodeJS
<br/><br/>
__LLM__
- LIama 3.3, HuggingFace, VLLM, OpenAILibrary, unSloth, RunPod
<br/><br/>
__AdminWebsite__
- Next.Js, PostgreSQL(Supabase), Prisma, Typescript, TailwindCSS
<br/><br/>
__MarketingWebsite__
- Next.Js, Typescript, TailwindCSS
<br/><br/>
__DiscordBot__
- Python, Discord.py
  





# Project Setup Guide

Follow these steps to set up and run the project on your local machine.

---

## 1. Install Node.js and Dependencies

1. Install [Node.js](https://nodejs.org/):
   - Make sure `npm` is installed along with Node.js.

2. Install the necessary Node.js dependencies:
  ```bash
   npm i
  ```

## 2. Create Python Virtual Environment

1. Create a vitural environment
```bash
python -m venv .venv
```
2. Activate the virtual environment.

Windows:
```bash
.venv\Scripts\Activate.ps1
```
MacOS/Linux:
```bash
source .venv/bin/activate
```

## 3. Install Python Requirements
```bash
pip install -r python_requirement.txt
```

## 4. Run the Application
```bash
npm run dev
```
