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

3. Install the necessary python requirements:
  ```bash
   pip install -r python_requirement.txt
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


npm install react-router-dom regenerator-runtime