from langchain.chains import ConversationChain
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain.memory import ConversationBufferMemory
from langchain.prompts import PromptTemplate
import os
from dotenv import load_dotenv

load_dotenv()

# 1. Set up the LLM (Large Language Model) with Gemini
# Ensure your Gemini API key is set as the environment variable GOOGLE_API_KEY.
if not os.getenv("GOOGLE_API_KEY"):
    raise ValueError("GOOGLE_API_KEY environment variable not set.")

# Use ChatGoogleGenerativeAI for Gemini models
llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.7)

# 2. Set up the memory
# This object stores the conversation history so the chatbot can remember context.
memory = ConversationBufferMemory()

# 3. Define the prompt template
# This is crucial for defining the chatbot's persona and purpose.
template = """
You are a highly efficient and polite customer service assistant for an online marketplace. Your purpose is to help customers with any questions they have related to their orders, products, shipping, returns, and account information. You must respond to customer queries clearly, concisely, and accurately based on the information provided.

You must remember the following:
- Be friendly, professional, and helpful at all times.
- If you cannot answer a question, politely state that you lack the information and suggest the customer contact a human representative.
- Do not make up information.
- Use a calm and reassuring tone.
- Avoid using any special formatting characters like asterisks (*) or dashes (-) in your responses.

Current conversation:
{history}
Human: {input}
AI:
"""
prompt = PromptTemplate(
    input_variables=["history", "input"],
    template=template
)

# 4. Create the conversation chain
# This links the LLM, prompt, and memory together to create the chatbot logic.
conversation = ConversationChain(
    llm=llm,
    prompt=prompt,
    memory=memory
)

# 5. The console loop
# This section runs the chatbot in your terminal, handling user input and displaying responses.
print(" Welcome to the Market Connect customer service. How can I assist you today? (type 'exit' to quit) ")
while True:
    user_input = input("You: ")
    if user_input.lower() == 'exit':
        print("Thank you for using our service. Goodbye!")
        break
    
    try:
        response = conversation.predict(input=user_input)
        print("AI:", response)
    except Exception as e:
        print(f"An error occurred: {e}")
        print("Please check your Gemini API key or try again later.")