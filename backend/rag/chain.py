from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import StrOutputParser
from langchain_core.runnables import RunnablePassthrough, Runnable
from langchain_core.retrievers import BaseRetriever

DEFAULT_PROMPT_TEMPLATE = '''You are answering questions about a YouTube video. Use ONLY the provided context. Context: {context} , Question: {question}.If answer isn't in context,
say: "I could not find that in the transcript."'''

def create_rag_chain(retriever: BaseRetriever, model_name: str = "gemini-2.5-flash", prompt_template: str = DEFAULT_PROMPT_TEMPLATE) -> Runnable:
    prompt = PromptTemplate(
        template=prompt_template,
        input_variables=['context', 'question']
    )
    model = ChatGoogleGenerativeAI(model=model_name)
    parser = StrOutputParser()
    chain = (
        {"context": retriever, "question": RunnablePassthrough()}
        | prompt
        | model
        | parser
    )
    return chain
