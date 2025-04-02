from typing import List
import gcsfs
from langchain_openai import ChatOpenAI
from unstructured.documents.elements import Element, Table
from unstructured.partition.md import partition_md
from os import getenv
from dotenv import load_dotenv

load_dotenv()


async def preprocess_docs(source_path: str, target_path: str):

    fs = gcsfs.GCSFileSystem(project=getenv("GOOGLE_PROJECT"), cache_timeout=0)

    with fs.open(source_path, "r") as f:
        source_doc = f.read()

    elements: List[Element] = partition_md(text=source_doc)
    final_content = ""
    for element in elements:
        if element.category == Table.category:
            table_description = await _llm_step(element.metadata.text_as_html)
            final_content += "\n\n" + table_description
        else:
            final_content += "\n\n" + element.text

    final_content += "\n"

    with fs.open(target_path, "w") as f:
        f.write(final_content)


async def _llm_step(table: str) -> str:
    system_prompt = """
        You are an AI assistant that converts structured HTML input into clear, simple paragraphs. The input will be an HTML snippet that contains tables or structured information. Your job is to rewrite it as paragraphs using easy-to-understand language, as if written by someone for whom English is a second language.  

        ### **Guidelines:**  
        1. **Preserve Important Details** – Keep all key facts and numbers from the original text.  
        2. **Use Simple Sentences** – Avoid complex sentence structures or advanced vocabulary.  
        3. **Write Clearly** – Use short, direct sentences to make the meaning easy to understand.  
        4. **Flatten the Structure** – Change tables, bullet points, and lists into a paragraph format.  
        5. **Maintain a Neutral and Professional Tone** – The text should sound factual and objective.  
        6. **Use Multiple Paragraphs If Needed** – If the information is too dense, split it into logical paragraphs for better readability.  
        7. **Return Only the Paragraphs** – Do not include explanations, apologies, or any extra commentary.  
    """

    llm = ChatOpenAI(
        temperature=0,
        model_name="gpt-4o",
        max_tokens=8192,
    )
    res = await llm.ainvoke([("system", system_prompt), ("user", table)])
    return res.content
