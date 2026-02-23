import os
from dotenv import load_dotenv

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_google_genai import GoogleGenerativeAIEmbeddings

load_dotenv()


class RAGEngine:
    def __init__(self):
        api_key = os.getenv("GEMINI_API_KEY")

        self.embeddings = GoogleGenerativeAIEmbeddings(
            model="models/text-embedding-004",
            google_api_key=api_key
        )

        base_dir = os.path.dirname(__file__)
        self.kb_dir = os.path.join(base_dir, "..", "knowledge_base")
        self.persist_directory = os.path.join(base_dir, "..", "vector_store")

        self.vector_db = None

    def ingest_pdfs(self):
        if not os.path.exists(self.kb_dir):
            os.makedirs(self.kb_dir)
            return

        documents = []
        for file in os.listdir(self.kb_dir):
            if file.endswith(".pdf"):
                path = os.path.join(self.kb_dir, file)
                loader = PyPDFLoader(path)
                documents.extend(loader.load())

        if not documents:
            return

        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=100
        )
        chunks = text_splitter.split_documents(documents)

        self.vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )

    def get_context(self, query: str):
        if not self.vector_db:
            if os.path.exists(self.persist_directory):
                self.vector_db = Chroma(
                    persist_directory=self.persist_directory,
                    embedding_function=self.embeddings
                )
            else:
                return ""

        results = self.vector_db.similarity_search(query, k=2)
        return "\n".join(doc.page_content for doc in results)
