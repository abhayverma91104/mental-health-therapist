import os
from dotenv import load_dotenv
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
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
        self.persist_directory = "./vector_store"
        self.vector_db = None

    def ingest_pdfs(self):
        if not os.path.exists("./knowledge_base"):
            os.makedirs("./knowledge_base")
            return
        
        # Load documents
        documents = []
        for file in os.listdir("./knowledge_base"):
            if file.endswith(".pdf"):
                loader = PyPDFLoader(os.path.join("./knowledge_base", file))
                documents.extend(loader.load())
        
        if not documents:
            return

        # Split and store
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_documents(documents)
        
        self.vector_db = Chroma.from_documents(
            documents=chunks,
            embedding=self.embeddings,
            persist_directory=self.persist_directory
        )
        print("Knowledge base updated successfully.")

    def get_context(self, query: str):
        if not self.vector_db:
            if os.path.exists(self.persist_directory):
                self.vector_db = Chroma(persist_directory=self.persist_directory, embedding_function=self.embeddings)
            else:
                return ""
        
        results = self.vector_db.similarity_search(query, k=2)
        return "\n".join([doc.page_content for doc in results])